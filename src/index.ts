import {
  CompleteOption,
  CompleteResult,
  ExtensionContext,
  sources,
  window,
  workspace,
  Range,
  VimCompleteItem,
  WorkspaceConfiguration,
} from 'coc.nvim';

import { getCodeCompletions, getCodeTranslation } from './utils/getCodeCompletions';
import { getDocumentLanguage } from './utils/getDocumentLanguage';
import { languageList } from './constants/index';

const SOURCE_NAME = 'coc-codegeex';

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('codegeex');
  const statusBarItem = window.createStatusBarItem(0, { progress: true });
  statusBarItem.text = 'coc-codegeex is generating completions...';

  context.subscriptions.push(
    // source
    sources.createSource({
      name: 'coc-codegeex completion source', // unique id
      // @ts-ignore
      triggerCharacters: [],
      doComplete: async (option: CompleteOption) => {
        statusBarItem.show();
        const items = await getCompletionItems(option, config);
        statusBarItem.hide();
        return items;
      },
      onCompleteDone: async (item: VimCompleteItem) => {
        // @ts-ignore
        if (item.source !== SOURCE_NAME) {
          return;
        }

        const lines = item.user_data?.split('\n');
        const lnum = (await workspace.nvim.call('line', ['.'])) as number;
        if (lines != null && lines[1] != null) {
          const appendLines = lines.slice(1);
          await workspace.nvim.call('append', [lnum, appendLines]);
          await workspace.nvim.call('setpos', [
            '.',
            [0, lnum + appendLines.length, appendLines.slice(-1)[0].length + 1],
          ]);
        }
        if (item.user_data?.endsWith('\n')) {
          await workspace.nvim.call('append', [lnum, ['']]);
          await workspace.nvim.call('setpos', ['.', [0, lnum + 1, 1]]);
        }
      },
    }),

    // keymap
    workspace.registerKeymap(
      ['v'],
      'codegeex-translate-keymap',
      async () => {
        const document = await workspace.document;
        const documentLanguageId = document.textDocument.languageId;
        const srcLang = getDocumentLanguage(documentLanguageId);
        if (languageList.indexOf(srcLang) === -1) {
          window.showMessage(`current language: ${srcLang} is not supported.`);
          return;
        }
        const targetLanguageIdx = await window.showQuickpick(languageList, 'Target Language');
        const dstLang = languageList[targetLanguageIdx];

        const { nvim } = workspace;
        const start = await nvim.call('getpos', [`'<`]);
        const end = await nvim.call('getpos', [`'>`]);
        const [startRow, startCol] = start.slice(1, 3);
        const [endRow, endCol] = end.slice(1, 3);
        const text = document.textDocument.getText(Range.create(startRow - 1, startCol - 1, endRow - 1, endCol - 1));

        statusBarItem.show();
        const translation = await getCodeTranslation(text, srcLang, dstLang, config.apiKey, config.apiSecret);
        statusBarItem.hide();
        const outputChannelName = 'coc-codegeex translation';
        const outputChannel = window.createOutputChannel(outputChannelName);
        const translationLines = translation[0].split('\n');
        for (const line of translationLines) {
          outputChannel.appendLine(line);
        }
        window.showOutputChannel(outputChannelName, true);
      },
      { sync: false }
    )
  );
}

async function getCompletionItems(
  option: CompleteOption,
  config: WorkspaceConfiguration
): Promise<CompleteResult | null> {
  const num = 3;
  const document = await workspace.document;
  const documentLanguageId = document.textDocument.languageId;
  const lang = getDocumentLanguage(documentLanguageId);
  const { linenr, colnr, line } = option;
  const maxLines = 100;
  const startLine = Math.max(linenr - maxLines, 0);
  const text = document.textDocument.getText(Range.create(startLine, 0, linenr - 1, colnr - 1));
  const prompt = text;
  try {
    const codeCompletions = await getCodeCompletions(prompt, num, lang, config.apiKey, config.apiSecret);
    const { completions, elapse } = codeCompletions;
    const completionItems = completions.map((comp) => {
      return {
        word: comp.split('\n')[0],
        // word: comp,
        menu: '[coc-codegeex]',
        filterText: `${line}`,
        user_data: comp,
        source: SOURCE_NAME,
        documentation: [
          {
            filetype: 'markdown',
            content: elapse,
          },
        ],
      };
    });

    if (completionItems && completionItems.length > 0) {
      // @ts-ignore
      completionItems[0].preSelect = true;
    }

    return {
      items: completionItems,
      priority: 1000,
      isIncomplete: true,
      startcol: colnr,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

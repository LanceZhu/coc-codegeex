import {
  CompleteOption,
  CompleteResult,
  ExtensionContext,
  sources,
  window,
  workspace,
  Range,
  VimCompleteItem,
} from 'coc.nvim';

import { getCodeCompletions, getCodeTranslation } from './utils/getCodeCompletions';
import { getDocumentLanguage } from './utils/getDocumentLanguage';

const SOURCE_NAME = 'coc-codegeex';

export async function activate(context: ExtensionContext): Promise<void> {
  window.showMessage(`coc-codegeex works!`);
  const config = workspace.getConfiguration('codegeex');
  console.log(JSON.stringify(config));

  context.subscriptions.push(
    // source
    sources.createSource({
      name: 'coc-codegeex completion source', // unique id
      triggerCharacters: [],
      doComplete: async (option: CompleteOption) => {
        const items = await getCompletionItems(option, config);
        return items;
      },
      onCompleteDone: async (item: VimCompleteItem, opt: CompleteOption) => {
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
        const { nvim } = workspace;
        const start = await nvim.call('getpos', [`'<`]);
        const end = await nvim.call('getpos', [`'>`]);
        const [startRow, startCol] = start.slice(1, 3);
        const [endRow, endCol] = end.slice(1, 3);
        const document = await workspace.document;
        const text = document.textDocument.getText(Range.create(startRow - 1, startCol - 1, endRow - 1, endCol - 1));
        const translation = await getCodeTranslation(
          text,
          config.srcLang,
          config.dstLang,
          config.apiKey,
          config.apiSecret
        );
        window.echoLines(translation[0].split('\n'));
      },
      { sync: false }
    )
  );
}

async function getCompletionItems(option: CompleteOption, config): Promise<CompleteResult> {
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
    let completions = await getCodeCompletions(prompt, num, lang, config.apiKey, config.apiSecret);
    completions = completions.map((comp) => {
      return {
        word: comp.split('\n')[0],
        // word: comp,
        menu: '[coc-codegeex]',
        filterText: `${line}`,
        user_data: comp,
        source: SOURCE_NAME,
      };
    });
    if (completions && completions.length > 0) {
      completions[0].preSelect = true;
    }

    return {
      items: completions,
      priority: 1000,
      isIncomplete: true,
      startcol: colnr,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

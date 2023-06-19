import {
  CompleteOption,
  ExtensionContext,
  sources,
  window,
  workspace,
  Range,
  VimCompleteItem,
} from 'coc.nvim';

import { requestCodeTranslation } from './requests/getCodeCompletions';
import { prepareCodeCompletions, prepareMenuCompletions } from './view';
import { getDocumentLanguage } from './utils/getDocumentLanguage';
import { languageList } from './constants/index';

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
        const codeCompletions = await prepareCodeCompletions(option, config);
        // const menuItems = prepareMenuCompletions(option, codeCompletions)
        statusBarItem.hide();
        // return menuItems;
        workspace.nvim.call('coc_codegeex#UpdatePreview', [['line1']]);
        return null;
      },
      onCompleteDone: async (item: VimCompleteItem) => {
        workspace.nvim.call('coc_codegeex#ClearPreview')
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
        const translation = await requestCodeTranslation(text, srcLang, dstLang, config.apiKey, config.apiSecret);
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


import {
  commands,
  CompleteOption,
  CompleteResult,
  ExtensionContext,
  listManager,
  sources,
  window,
  workspace,
  Range,
} from 'coc.nvim';
import DemoList from './lists';
import { getCodeCompletions } from './utils/getCodeCompletions';
import codegeexConfig from './config/codegeex';
import { getLanguage } from './utils/getLanguage';

export async function activate(context: ExtensionContext): Promise<void> {
  window.showMessage(`coc-codegeex works!`);

  context.subscriptions.push(
    commands.registerCommand('coc-codegeex.Command', async () => {
      window.showMessage(`coc-codegeex Commands works!`);
    }),

    listManager.registerList(new DemoList(workspace.nvim)),

    sources.createSource({
      name: 'coc-codegeex completion source', // unique id
      triggerCharacters: [],
      priority: 1000,
      firstMatch: false,
      doComplete: async (option: CompleteOption) => {
        const items = await getCompletionItems(option);
        return items;
      },
    }),

    workspace.registerKeymap(
      ['n'],
      'codegeex-keymap',
      async () => {
        window.showMessage(`registerKeymap`);
      },
      { sync: false }
    ),

    workspace.registerAutocmd({
      event: 'InsertLeave',
      request: true,
      callback: () => {
        window.showMessage(`registerAutocmd on InsertLeave`);
      },
    })
  );
}

async function getCompletionItems(option: CompleteOption): Promise<CompleteResult> {
  const num = 1;
  const lang = getLanguage('');
  const document = await workspace.document;
  const { linenr, colnr } = option;
  const startLine = Math.max(linenr - 10, 0);
  const text = document.textDocument.getText(Range.create(startLine, 0, linenr, colnr));
  const prompt = text;
  try {
    const completions = await getCodeCompletions(prompt, num, lang, codegeexConfig.apiKey, codegeexConfig.apiSecret);
    return {
      items: completions.map((comp) => {
        return {
          word: `${option.triggerCharacter}${comp}`,
          menu: '[coc-codegeex]',
        };
      }),
      priority: 1000,
    };
    // return {
    //   items: [
    //     {
    //       word: `${option.triggerCharacter}TestCompletionItem`,
    //       menu: '[coc-codegeex]',
    //     },
    //     {
    //       word: 'TestCompletionItem 2',
    //       menu: '[coc-codegeex]',
    //     },
    //   ],
    //   priority: 1000,
    // };
  } catch (e) {
    console.error(e);
    return null;
  }
}

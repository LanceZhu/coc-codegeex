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
  VimCompleteItem,
} from 'coc.nvim';

import DemoList from './lists';
import { getCodeCompletions } from './utils/getCodeCompletions';
import { getLanguage } from './utils/getLanguage';

export async function activate(context: ExtensionContext): Promise<void> {
  window.showMessage(`coc-codegeex works!`);
  const config = workspace.getConfiguration('codegeex');
  console.log(config);

  context.subscriptions.push(
    commands.registerCommand('coc-codegeex.Command', async () => {
      window.showMessage(`coc-codegeex Commands works!`);
    }),

    listManager.registerList(new DemoList(workspace.nvim)),

    sources.createSource({
      name: 'coc-codegeex completion source', // unique id
      triggerCharacters: [],
      doComplete: async (option: CompleteOption) => {
        const items = await getCompletionItems(option, config);
        return items;
      },
      onCompleteDone: async (item: VimCompleteItem, opt: CompleteOption) => {
        const currentLine = (await workspace.nvim.call('getline', ['.'])) as string;
        console.log('currentLine:', currentLine, opt);
      },
    }),

    workspace.registerKeymap(
      ['n'],
      'codegeex-keymap',
      async () => {
        window.showMessage(`registerKeymap`);
      },
      { sync: false }
    )
  );
}

async function getCompletionItems(option: CompleteOption, config): Promise<CompleteResult> {
  const num = 1;
  const lang = getLanguage('');
  const document = await workspace.document;
  const { linenr, colnr, line } = option;
  const startLine = Math.max(linenr - 10, 0);
  const text = document.textDocument.getText(Range.create(startLine, 0, linenr, colnr));
  const prompt = text;
  console.log(option);
  const prefixOfSymbol = line.slice(0, colnr).split(' ').pop();
  console.log('prefixOfSymbol:', prefixOfSymbol);
  try {
    const completions = await getCodeCompletions(prompt, num, lang, config.apiKey, config.apiSecret);
    return {
      items: completions.map((comp) => {
        return {
          word: `${prefixOfSymbol}${comp.split('\n')[0]}`,
          menu: '[coc-codegeex]',
        };
      }),
      priority: 1000,
      isIncomplete: true,
    };
    // return {
    //   items: [
    //     {
    //       word: `${prefixOfSymbol}TestCompletionItem 1`,
    //       sortText: '0',
    //       preSelect: true,
    //       documentation: [{
    //         filetype: 'markdown',
    //         content: '# test',
    //       }],
    //     },
    //     {
    //       word: `${prefixOfSymbol}TestCompletionItem 2`,
    //       sortText: '00',
    //     },
    //   ],
    //   isIncomplete: true,
    //   priority: 1000,
    // };
  } catch (e) {
    console.error(e);
    return null;
  }
}

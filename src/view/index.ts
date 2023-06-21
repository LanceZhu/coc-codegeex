import { CompleteOption, WorkspaceConfiguration, workspace, CompleteResult, Range } from 'coc.nvim';

import { CodeCompletions, requestCodeCompletions } from '../requests/getCodeCompletions';
import { getDocumentLanguage } from '../utils/getDocumentLanguage';
import { SOURCE_NAME } from '../constants';

export async function prepareCodeCompletions(
  option: CompleteOption,
  config: WorkspaceConfiguration
): Promise<CodeCompletions | null> {
  const num = 3;
  const document = await workspace.document;
  const documentLanguageId = document.textDocument.languageId;
  const lang = getDocumentLanguage(documentLanguageId);
  const { linenr, colnr } = option;
  const maxLines = 100;
  const startLine = Math.max(linenr - maxLines, 0);
  const text = document.textDocument.getText(Range.create(startLine, 0, linenr - 1, colnr - 1));
  const prompt = text;
  try {
    const codeCompletions = await requestCodeCompletions(prompt, num, lang, config.apiKey, config.apiSecret);
    return codeCompletions;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function prepareMenuCompletions(
  option: CompleteOption,
  codeCompletions: CodeCompletions | null
): CompleteResult | null {
  if (codeCompletions === null) {
    return null;
  }
  const { colnr, line } = option;
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
    startcol: colnr + 100,
  };
}

export function prepareInlineCompletions(lines: string[] | undefined) {
  workspace.nvim.call('coc_codegeex#ClearPreview');

  if (lines === undefined) {
    return;
  }

  workspace.nvim.call('coc_codegeex#UpdatePreview', [lines]);
}

export async function confirmCodeCompletions(lines: string[] | undefined) {
  if (lines === undefined) {
    return;
  }
  const appendLines = lines.slice(1);
  const lnum = (await workspace.nvim.call('line', ['.'])) as number;
  await workspace.nvim.call('append', [lnum, appendLines]);
  await workspace.nvim.call('setpos', ['.', [0, lnum + appendLines.length, appendLines.slice(-1)[0].length + 1]]);
}

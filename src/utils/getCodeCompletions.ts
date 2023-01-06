import got from 'got';

export type GetCodeCompletions = {
  completions: Array<string>;
};

export async function getCodeCompletions(
  prompt: string,
  num: number,
  lang: string,
  apiKey: string,
  apiSecret: string
): Promise<GetCodeCompletions> {
  const API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate`;
  const payload = {
    prompt: prompt,
    n: num,
    apikey: apiKey,
    apisecret: apiSecret,
  };
  if (lang.length !== 0) {
    payload.lang = lang;
  }
  const inputText = prompt;
  console.log('inputText:', inputText);
  const res = await got
    .post(API_URL, {
      json: payload,
    })
    .json();
  console.log(res);
  if (res.status !== 0) {
    return null;
  }
  let completions = res.result.output.code;
  completions = completions.filter((el) => el.trim() !== '');
  console.log('completions:', completions);
  return completions;
}

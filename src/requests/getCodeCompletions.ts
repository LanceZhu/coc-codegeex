import got from 'got';

export type CodeCompletions = {
  completions: Array<string>;
  elapse: string;
};

type HTTPAPIResponse = {
  message: string;
  status: number;
  result: any;
};

export async function requestCodeCompletions(
  prompt: string,
  num: number,
  lang: string,
  apiKey: string,
  apiSecret: string
): Promise<CodeCompletions> {
  const API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate`;
  const payload = {
    prompt: prompt,
    n: num,
    lang,
    apikey: apiKey,
    apisecret: apiSecret,
  };
  const res: HTTPAPIResponse = await got
    .post(API_URL, {
      json: payload,
    })
    .json();
  // console.log('res:', JSON.stringify(res));
  if (res.status !== 0) {
    return {
      completions: [],
      elapse: '0s',
    };
  }
  let completions = res.result.output.code;
  completions = completions.filter((el: any) => el.trim() !== '');

  return {
    completions,
    elapse: `${res.result.process_time.toFixed(2)}s`,
  };
}

export async function requestCodeTranslation(
  prompt: string,
  srcLang: string,
  dstLang: string,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_translate`;
  const payload = {
    prompt: prompt,
    src_lang: srcLang,
    dst_lang: dstLang,
    apikey: apiKey,
    apisecret: apiSecret,
  };
  const res: HTTPAPIResponse = await got
    .post(API_URL, {
      json: payload,
    })
    .json();
  if (res.status !== 0) {
    return '';
  }
  const translation = res.result.output.code;
  return translation;
}

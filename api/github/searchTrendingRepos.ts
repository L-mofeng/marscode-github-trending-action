import { Args } from '@/runtime';
import * as cheerio from 'cheerio';

// Define the Input interface which specifies the optional parameters for searching trending GitHub repositories.
export interface Input {
    language?: string; // Optional parameter for filtering repositories by programming language
    since?: 'daily' | 'weekly' | 'monthly'; // Optional parameter for specifying the time range of trending repositories
}

// Define the Output interface which specifies the structure of the response object.
export interface Output {
    repos: GithubRepo[]; // An array of GithubRepo objects representing the trending repositories
}

// Define a TypeScript interface for the trending GitHub repositories
interface GithubRepo {
    name: string; // The name of the repository
    description: string; // The description of the repository
    url: string; // The URL of the repository
    author: string; // The author of the repository
    language: string; // The programming language used in the repository
    stars: number; // The total number of stars of the repository
    todayStars: number; // The number of stars received by the repository today
}

async function searchRepos(input: Input): Promise<GithubRepo[]> {
    let url = 'https://github.com/trending';
    // 可以通过 language 和 since 来搜索
    if (input.language) {
      url += `/${input.language}`;
    }
    if (input.since) {
      url += `?since=${input.since}`;
    }
  
    try {
      // 发送网络请求，从 GitHub Trending 获取到html。
      const response = await fetch(url);
      const body = await response.text();
      // 使用 cheerio 解析返回的html，提取项目的信息
      const $ = cheerio.load(body);
      // 初始化仓库信息列表。
      let repositoriesInfo = [];
  
      // 遍历页面上的所有<article class="Box-row">元素。
      $('article.Box-row').each(function () {
        const article = $(this);
        // 提取数据。
        const name = article.find('h2.h3 a').text().trim();
        const url = 'https://github.com' + article.find('h2.h3 a').attr('href');
        const author = article.find('span.text-normal').text().trim().replace(' /', '');
        const stars = article.find('a[href*="/stargazers"]').last().text().trim().replace(/,/g, ''); // 移除数字中的逗号。
        const todayStarsText = article.find('.d-inline-block.float-sm-right').text().trim();
        const todayStarsMatch = todayStarsText.match(/(\d+)/);
        const todayStars = todayStarsMatch ? parseInt(todayStarsMatch[0], 10) : 0;
        const language = article.find('[itemprop="programmingLanguage"]').text().trim();
        const description = article.find('p.color-fg-muted').text().trim(); // 提取仓库介绍
  
        repositoriesInfo.push({
          description,
          language,
          name,
          url,
          author,
          stars,
          todayStars
        });
      });
  
      return repositoriesInfo;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    return []
   }

/**
 * Search the trending GitHub repos
 */
export async function handler({ input, logger }: Args<Input>): Promise<Output> {

  logger.info(`The input is ${JSON.stringify(input)}`)
  return {
    repos: await searchRepos(input)
  }
}
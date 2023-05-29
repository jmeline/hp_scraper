import * as cheerio from 'cheerio'
import axios from 'axios'

const site = "https://hpaudiobooks.co"
console.log(site)

// obtain all harry potter audio books
const getLoadedCheerioHtml = async url => {
  const response = await axios.get(url)
  return cheerio.load(response.data)
}

const getBooks = async authorUrl => {
  const $ = await getLoadedCheerioHtml(authorUrl)
  return $('h2.title-post > a').map((_, book) => $(book).attr("href"))
}

const getAllAudioLinks = async url => {
  const $ = await getLoadedCheerioHtml(url)
  const links = $('div.pgntn-page-pagination-block > a')
    .map((_, book) => $(book).attr("href"))
  // const firstLink = links[0].replace(/\d\//, '')
  return [url, ...new Set(links)]
}

const jimDaleAudioBooks = await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks = await getBooks("https://hpaudiobooks.co/series/stephen/")

console.log(jimDaleAudioBooks)
console.log(stephenFryAudioBooks)

// get audio links
const getAudioAndChapter = async url => {
  console.log(`url: ${url}`)
  const $ = await getLoadedCheerioHtml(url)

  // const chapters = $('p em')
  // for (const chapter of chapters) {
  //   console.log(chapter.children[0].data)
  // }
  const audios = $('audio source')
  for (const audio of audios) {
    console.log($(audio).attr('src'))
  }
}

const results = await getAudioAndChapter(jimDaleAudioBooks[0])


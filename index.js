import * as cheerio from 'cheerio'
import axios from 'axios'

const site = "https://hpaudiobooks.co"
console.log(site)

// obtain all harry potter audio books
// const books = $('div.pt-cv-ifield > a.pt-cv-href-thumbnail')
const getLoadedCheerioHtml = async url => {
  const response = await axios.get(url)
  const html = response.data
  return cheerio.load(html)
}

const getBooks = async url => {
  const $ = await getLoadedCheerioHtml(url)
  const books = $('h2.title-post > a')
  const bookUrls = []
  for (const book of books) {
    const url = book.attribs.href
    bookUrls.push(url)
  }
  return bookUrls
}

const jimDaleAudioBooks = await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks = await getBooks("https://hpaudiobooks.co/series/stephen/")

console.log(jimDaleAudioBooks)
console.log(stephenFryAudioBooks)

// get audio links

const getAudioAndChapter = async url => {
  console.log(`url: ${url}`)
  const $ = await getLoadedCheerioHtml(url)

  const pages = $('a.post-page-numbers:contains("Next")')
  console.log(`next url: ${pages[0].attribs.href}`)
  const items = $('div.post-single > ')
  const chapters = $('p em')
  const audios = $('audio')
  for (const chapter of chapters) {
    console.log(chapter.children[0].data)
  }
  for (const audio of audios) {
    console.log(audio.children[0].attribs.src)
  }
}

const results = await getAudioAndChapter(jimDaleAudioBooks[0])


import * as cheerio from 'cheerio'
import axios from 'axios'
import fs from 'fs'

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

const getAllPaginationLinks = async url => {
  const $ = await getLoadedCheerioHtml(url)
  const links = $('div.pgntn-page-pagination-block > a')
    .map((_, book) => $(book).attr("href"))
  return [url, ...new Set(links)]
}

const downloadAudio = async (audioUrl, filename) => {
  return new Promise(async (resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);

    const response = await axios.get({
      method: "get",
      url: audioUrl,
    })
    response.data.pipe(fileStream)
    fileStream.on('finish', () => {
      console.log(`Audio downloaded successfully as "${filename}"`);
      fileStream.close();
      resolve();
    });

    fileStream.on('error', (error) => {
      reject(error);
    });
  });
};

const getAllAudioLinks = async url => {
  const audioLinks = await getAllPaginationLinks(url)
  console.log("audioLinks: ", audioLinks)
  const allAudioLinks = []
  for (const link of audioLinks) {
    const response = await axios.get(link)
    const $ = cheerio.load(response.data)
    // const audioLink = $('audio source').attr('src')
    $('audio source').each((index, audio) => {
      const audioLink = $(audio).attr('src')
      const filename = `audio_${index + 1}.mp3`
      console.log(`AudioLink: '${audioLink}', filename: '${filename}'`)
      allAudioLinks.push(downloadAudio(audioLink, filename))
    })
  }
  await Promise.all(allAudioLinks)
  return allAudioLinks
}

const jimDaleAudioBooks = await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks = await getBooks("https://hpaudiobooks.co/series/stephen/")

// console.log(jimDaleAudioBooks)
// console.log(stephenFryAudioBooks)

// get audio links
const getAudioLink = async url => {
  console.log(`url: ${url}`)
  const $ = await getLoadedCheerioHtml(url)

  // const chapters = $('p em')
  // for (const chapter of chapters) {
    //   console.log(chapter.children[0].data)
    // }
  const audios = $('audio source')
  for (const audio of audios) {
    // console.log($(audio).attr('src'))
  }
}

// const results = await getAudioLink(jimDaleAudioBooks[0])
console.log("RESULTS!!!")
await getAllAudioLinks(jimDaleAudioBooks[0])
// console.log(await getAllAudioLinks(jimDaleAudioBooks[1]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[2]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[3]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[4]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[5]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[6]))


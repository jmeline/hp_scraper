import * as cheerio from 'cheerio'
import axios from 'axios'
import fs from 'fs'
import https from "https"

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
    https.get(audioUrl, (response) => {
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log(`Audio downloaded successfully as "${filename}"`);
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (error) => {
        reject(error);
      });
    });

    // const response = await axios.get({
    //   method: "get",
    //   url: audioUrl,
    // })
    // response.data.pipe(fileStream)
    // fileStream.on('finish', () => {
    //   console.log(`Audio downloaded successfully as "${filename}"`);
    //   fileStream.close();
    //   resolve();
    // });
    //
    // fileStream.on('error', (error) => {
    //   reject(error);
    // });
  });
};

const getAllAudioLinks = async (url, directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
    console.log(`Created ${directory}`)
  }
  const audioLinks = await getAllPaginationLinks(url)
  // console.log("audioLinks: ", audioLinks)
  const allAudioLinks = []
  for (const link of audioLinks) {
    const response = await axios.get(link)
    const $ = cheerio.load(response.data)
    // const audioLink = $('audio source').attr('src')
    $('audio source').each((index, audio) => {
      const audioLink = $(audio).attr('src')
      const match = audioLink.match(/\/([^\/]+\.mp3)/)
      let filename = `audio_${index + 1}.mp3`
      if (match) {
        filename = match[1].replace(/%20/g, "_")
      }
      const path = `${directory}/${filename}`
      console.log(`AudioLink: '${audioLink}', path: '${path}'`)
      allAudioLinks.push(downloadAudio(audioLink, path))
    })
  }
  await Promise.all(allAudioLinks)
  return allAudioLinks
}

const jimDaleAudioBooks = await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks = await getBooks("https://hpaudiobooks.co/series/stephen/")

console.log(jimDaleAudioBooks)
// console.log(stephenFryAudioBooks)

// const results = await getAudioLink(jimDaleAudioBooks[0])
console.log("RESULTS!!!")
await getAllAudioLinks(jimDaleAudioBooks[0], "hp_1_the_sorcerers_stone")
await getAllAudioLinks(jimDaleAudioBooks[1], "hp_2_the_chamber_of_secrets")
await getAllAudioLinks(jimDaleAudioBooks[2], "hp_3_the_prisoner_of_azkaban")
await getAllAudioLinks(jimDaleAudioBooks[3], "hp_4_the_goblet_of_fire")
await getAllAudioLinks(jimDaleAudioBooks[4], "hp_5_the_order_of_the_phoenix")
await getAllAudioLinks(jimDaleAudioBooks[5], "hp_6_the_half_blood_prince")
await getAllAudioLinks(jimDaleAudioBooks[6], "hp_7_the_deathly_hollows")
// console.log(await getAllAudioLinks(jimDaleAudioBooks[1]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[2]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[3]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[4]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[5]))
// console.log(await getAllAudioLinks(jimDaleAudioBooks[6]))


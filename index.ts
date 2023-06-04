import * as cheerio from 'cheerio'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

const site = "https://hpaudiobooks.co"
console.log(site)

// obtain all harry potter audio books
const getLoadedCheerioHtml = async (url: string) => {
  const response = await axios.get(url)
  return cheerio.load(response.data)
}

const getBooks = async (authorUrl:string) => {
  const $ = await getLoadedCheerioHtml(authorUrl)
  return $('h2.title-post > a').map((_, book) => $(book).attr("href"))
}

const getAllPaginationLinks = async (url:string) => {
  const $ = await getLoadedCheerioHtml(url)
  const links = $('div.pgntn-page-pagination-block > a')
    .map((_, book) => $(book).attr("href"))
  return [url, ...new Set(links)]
}

const downloadAudio = async (audioUrl: string, filename: string) => {
  console.log(`Downloading audio as "${filename}"`);
  return new Promise<void>(async (resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);

    const response = await axios({
      method: "GET",
      url: audioUrl,
      responseType: 'stream'
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

const getAllAudioLinks = async function(url: string, directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
    console.log(`Created ${directory}`)
  }
  const audioLinks = await getAllPaginationLinks(url)
  console.log("Grabbing all audioLinks: ", audioLinks)
  const allResponses = await Promise.all(audioLinks.map(link => axios.get(link)))
  console.log("Finished grabbing all audioLinks: ", allResponses.length)

  const allAudioLinks = []
  for (const response of allResponses) {
    const $ = cheerio.load(response.data)
    $('audio source').each((index, audio) => {
      const audioLink = $(audio).attr('src')
      const match = audioLink.match(/\/([^\/]+\.mp3)/)
      let filename = `audio_${index + 1}.mp3`
      if (match) {
        filename = match[1].replace(/%20/g, "_")
      }
      const localPath = path.resolve(directory, filename)
      console.log(`AudioLink: '${audioLink}', path: '${localPath}'`)
      allAudioLinks.push(downloadAudio(audioLink, localPath))
    })
  }
  await Promise.all(allAudioLinks)
  return allAudioLinks
}

const jimDaleAudioBooks = await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks = await getBooks("https://hpaudiobooks.co/series/stephen/")

console.log(jimDaleAudioBooks)
// console.log(stephenFryAudioBooks)

await getAllAudioLinks(jimDaleAudioBooks[0], "hp_1_the_sorcerers_stone")
await getAllAudioLinks(jimDaleAudioBooks[1], "hp_2_the_chamber_of_secrets")
await getAllAudioLinks(jimDaleAudioBooks[2], "hp_3_the_prisoner_of_azkaban")
await getAllAudioLinks(jimDaleAudioBooks[3], "hp_4_the_goblet_of_fire")
await getAllAudioLinks(jimDaleAudioBooks[4], "hp_5_the_order_of_the_phoenix")
await getAllAudioLinks(jimDaleAudioBooks[5], "hp_6_the_half_blood_prince")
await getAllAudioLinks(jimDaleAudioBooks[6], "hp_7_the_deathly_hollows")

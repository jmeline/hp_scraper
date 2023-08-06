import * as cheerio from 'cheerio'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import axiosRetry from 'axios-retry'

axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay})

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
  console.log(`Downloading audio "${chalk.green(filename)}" from "${chalk.red(audioUrl)}"`);
  return new Promise<void>(async (resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);

    // Make a GET request to download the audio file
    // https.get(audioUrl, (response) => {
    //     // Pipe the response data to the write stream
    //     response.pipe(fileStream);
    //
    //     // Handle the end event when the download is complete
    //     fileStream.on('finish', () => {
    //         console.log(`Audio downloaded successfully as "${filename}"`);
    //         fileStream.close();
    //     });
    //
    const response = await axios({
        method: "get",
        url: audioUrl,
        responseType: 'stream'
    })

    response.data.pipe(fileStream)
    fileStream.on('finish', () => {
        console.log(`Finished downloading: ${chalk.magenta(filename)}`);
        fileStream.close();
        resolve();
    });

    fileStream.on('error', (error) => {
        console.log(error)
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
      const audioLink: string = $(audio).attr('src').replace(/\?_=\d+/, "")
      const match: RegExpMatchArray = audioLink.match(/\/([^\/]+\.mp3)/)
      let filename: string = `audio_${index + 1}.mp3`
      if (match) {
        filename = match[1].replace(/%20/g, "_")
      }
      const localPath: string = path.resolve(directory, filename)
      allAudioLinks.push(downloadAudio(audioLink, localPath))
    })
  }
  await Promise.all(allAudioLinks)
  return allAudioLinks
}

const jimDaleAudioBooks: cheerio.Cheerio<string> =
    await getBooks("https://hpaudiobooks.co/series/hp-jim-dale/")
const stephenFryAudioBooks: cheerio.Cheerio<string> =
    await getBooks("https://hpaudiobooks.co/series/stephen/")

const GetBook = async function(audiobooks: cheerio.Cheerio<string>, path: string) {
    const bookTitles: string[] = [
     "hp_1_the_sorcerers_stone",
     "hp_2_the_chamber_of_secrets",
     "hp_3_the_prisoner_of_azkaban",
     "hp_4_the_goblet_of_fire",
     "hp_5_the_order_of_the_phoenix",
     "hp_6_the_half_blood_prince",
     "hp_7_the_deathly_hollows"
    ]
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
        console.log(`Created ${path}`)
    }

    const promises = []
    for (var i = 0; i < audiobooks.length; i++) {
        promises.push(getAllAudioLinks(audiobooks[i], `${path}/${bookTitles[i]}`))
    }
    await Promise.all(promises)
}

await GetBook(jimDaleAudioBooks, "JimDale")
await GetBook(stephenFryAudioBooks, "StephenFry")

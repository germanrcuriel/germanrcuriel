import { promises as fs } from 'fs'
import fetch from 'node-fetch'

import { PLACEHOLDERS, NUMBER_OF } from './constants.js'

const INSTAGRAM_USER_ID = '7478530008'
const YOUTUBE_PLAYLIST_ID = 'PLLHk2Uy_-FtomyaPhJnjb5o3w3YNZP7Za'

const { INSTAGRAM_API_KEY, YOUTUBE_API_KEY } = process.env

const getMediaFromInstagram = async () => {
  const response = await fetch(`https://instagram130.p.rapidapi.com/account-medias?userid=${INSTAGRAM_USER_ID}&first=20`, {
    headers: {
      'x-rapidapi-host': 'instagram130.p.rapidapi.com',
      'x-rapidapi-key': INSTAGRAM_API_KEY
    }
  })

  const json = await response.json()

  return json?.edges
}

const getLatestYoutubeVideos = () => {
  return fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${YOUTUBE_PLAYLIST_ID}&maxResults=${NUMBER_OF.VIDEOS}&key=${YOUTUBE_API_KEY}`
  )
    .then((res) => res.json())
    .then((videos) => videos.items)
}

const generateInstagramHTML = ({ node: { display_url: url, shortcode } }) => {
  return `<a href='https://instagram.com/p/${shortcode}' target='_blank'><img width='22.5%' src='${url}' alt='Instagram photo' /></a>`
}

const generateYoutubeHTML = ({ title, videoId }, withLineBreak) => {
  const lineBreak = withLineBreak ? `<br />` : ''
  return `<a href="https://youtu.be/${videoId}" target="blank"><img width="30%" src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="${title}" title="${title}" /></a>${lineBreak}`
}

console.log('starting...');

(async () => {
  const [template, photos, videos] = await Promise.all([
    fs.readFile('./src/README.md.tpl', { encoding: 'utf-8' }),
    getMediaFromInstagram(),
    getLatestYoutubeVideos()
  ])

  // create latest media from instagram
  const latestInstagramMedia = photos
    .filter((item) => item.node.is_video)
    .slice(0, NUMBER_OF.PHOTOS)
    .map(generateInstagramHTML)
    .join('  &#8287;')

  // create latest youtube videos channel
  const latestYoutubeVideos = videos
    .map(({ snippet }, index) => {
      const { title, resourceId } = snippet
      const { videoId } = resourceId
      const withLineBreak = index === ((NUMBER_OF.VIDEOS / 2) - 1)
      return generateYoutubeHTML({ videoId, title }, withLineBreak)
    })
    .join('  &#8287;')

  // replace all placeholders with info
  const newMarkdown = template
    .replace(PLACEHOLDERS.LATEST_INSTAGRAM, latestInstagramMedia)
    .replace(PLACEHOLDERS.LATEST_YOUTUBE, latestYoutubeVideos)

  await fs.writeFile('README.md', newMarkdown)
})()

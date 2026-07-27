import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>MONA — Elemental Cancer Research</title>
        <meta name="description" content="Evidence-aware elemental composition analysis for cancer research." />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

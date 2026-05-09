import React from 'react'
import Hero from '../components/Hero'
import FeaturedSection from '../components/FeaturedSection'
import Banner from '../components/Banner'
import FeedbackSection from '../components/FeedbackSection'
import Newsletter from '../components/Newsletter'

const Home = () => {
  return (
    <>
      <Hero />
      <FeaturedSection />
      <Banner />

      {/* Live Feedback Section */}
      <FeedbackSection />

      <Newsletter />
    </>
  )
}

export default Home

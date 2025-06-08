"use client"

import { useEffect } from "react"

export const useInfiniteScroll = ({ hasNextPage, isFetchingNextPage, fetchNextPage }) => {
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the page
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 1000

      if (scrolledToBottom && hasNextPage && !isFetchingNextPage && fetchNextPage) {
        console.log("Triggering fetchNextPage") // Debug log
        fetchNextPage()
      }
    }

    // Add event listener
    window.addEventListener("scroll", handleScroll)

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
}

"use client"

import { useEffect, useRef } from "react"

export const useInfiniteScroll = ({ hasNextPage, isFetchingNextPage, fetchNextPage }) => {
  const observerRef = useRef(null)
  
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    // Skip if we're already fetching or there's no next page
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return
    
    // Create new IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        // If the sentinel element is visible and we have more pages
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("Intersection observed, fetching next page")
          fetchNextPage()
        }
      },
      {
        // Adjust rootMargin to trigger earlier
        rootMargin: "0px 0px 500px 0px",
        threshold: 0.1,
      }
    )
    
    // Create and observe a sentinel element
    const sentinel = document.createElement("div")
    sentinel.id = "infinite-scroll-sentinel"
    sentinel.style.height = "10px"
    sentinel.style.width = "100%"
    
    // Append sentinel to the end of the content
    document.querySelector("body").appendChild(sentinel)
    observer.observe(sentinel)
    
    // Store observer for cleanup
    observerRef.current = observer
    
    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (sentinel && sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  
  // Also add scroll event as backup
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      
      // If we're near the bottom (500px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        console.log("Scroll threshold reached, fetching next page")
        fetchNextPage()
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
}

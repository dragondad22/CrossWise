'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            CrossWise
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload JSON lists of terms & clues to auto-generate shareable crosswords organized by topic
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Getting Started
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first topic and upload a word list to begin generating crosswords
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Upload Lists</h3>
                  <p className="text-sm text-gray-600">
                    Import JSON files with terms and clues organized by topic
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Generate Puzzles</h3>
                  <p className="text-sm text-gray-600">
                    Auto-generate crossword grids with smart word placement
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🧩</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Solve & Study</h3>
                  <p className="text-sm text-gray-600">
                    Interactive solving with progress saving and hints
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Link
                  href="/topics"
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
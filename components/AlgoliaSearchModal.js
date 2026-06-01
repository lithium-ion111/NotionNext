import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import algoliasearch from 'algoliasearch/lite'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useRef, useState, useImperativeHandle } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { throttle } from 'lodash'
import SmartLink from '@/components/SmartLink'

/**
 * Algoliaを使用した検索モーダル
 */
export default function AlgoliaSearchModal({ cRef }) {
  const [searchResults, setSearchResults] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState(null)
  const [totalPage, setTotalPage] = useState(0)
  const [totalHit, setTotalHit] = useState(0)
  const [useTime, setUseTime] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const inputRef = useRef(null)
  const router = useRouter()

  /**
   * ショートカットキーの設定
   */
  useHotkeys('ctrl+k', e => {
    e.preventDefault()
    setIsModalOpen(true)
  })

  useHotkeys(
    'down',
    e => {
      if (isInputFocused) {
        e.preventDefault()
        if (activeIndex < searchResults.length - 1) {
          setActiveIndex(activeIndex + 1)
        }
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'up',
    e => {
      if (isInputFocused) {
        e.preventDefault()
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1)
        }
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'esc',
    e => {
      if (isInputFocused) {
        e.preventDefault()
        setIsModalOpen(false)
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'enter',
    e => {
      if (isInputFocused && searchResults.length > 0) {
        onJumpSearchResult()
      }
    },
    { enableOnFormTags: true }
  )

  const onJumpSearchResult = () => {
    if (searchResults.length > 0) {
      const searchResult = searchResults[activeIndex]
      window.location.href = `${siteConfig('SUB_PATH', '')}/${searchResult.slug || searchResult.objectID}`
    }
  }

  const resetSearch = () => {
    setActiveIndex(0)
    setKeyword('')
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  useEffect(() => {
    setIsModalOpen(false)
  }, [router])

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      resetSearch()
    }
  }, [isModalOpen])

  useImperativeHandle(cRef, () => {
    return {
      openSearch: () => {
        setIsModalOpen(true)
      }
    }
  })

  const client = algoliasearch(
    siteConfig('ALGOLIA_APP_ID'),
    siteConfig('ALGOLIA_SEARCH_ONLY_APP_KEY')
  )
  const index = client.initIndex(siteConfig('ALGOLIA_INDEX'))

  const handleSearch = async (query, page) => {
    setKeyword(query)
    setPage(page)
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    setActiveIndex(0)
    if (!query || query === '') {
      return
    }
    setIsLoading(true)
    try {
      const res = await index.search(query, { page, hitsPerPage: 10 })
      const { hits, nbHits, nbPages, processingTimeMS } = res
      setUseTime(processingTimeMS)
      setTotalPage(nbPages)
      setTotalHit(nbHits)
      setSearchResults(hits)
      setIsLoading(false)
      
      // replaceSearchResult 呼び出し箇所を削除しました
    } catch (error) {
      console.error('Algolia search error:', error)
      setIsLoading(false)
    }
  }

  const throttledHandleInputChange = useRef(
    throttle((query, page = 0) => {
      handleSearch(query, page)
    }, 1000)
  )

  const searchTimer = useRef(null)

  const handleInputChange = e => {
    const query = e.target.value
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }
    searchTimer.current = setTimeout(() => {
      throttledHandleInputChange.current(query)
    }, 800)
  }

  const switchPage = page => {
    throttledHandleInputChange.current(keyword, page)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (!siteConfig('ALGOLIA_APP_ID')) {
    return <></>
  }

  return (
    <div
      id='search-wrapper'
      className={`${
        isModalOpen ? 'opacity-100' : 'invisible opacity-0 pointer-events-none'
      } z-30 fixed h-screen w-screen left-0 top-0 sm:mt-[10vh] flex items-start justify-center mt-0`}>
      
      <div
        className={`${
          isModalOpen ? 'opacity-100' : 'invisible opacity-0 translate-y-10'
        } max-h-[80vh] flex flex-col justify-between w-full min-h-[10rem] h-full md:h-fit max-w-xl dark:bg-hexo-black-gray dark:border-gray-800 bg-white p-5 rounded-lg z-50 shadow border hover:border-blue-600 duration-300 transition-all `}>
        
        <div className='flex justify-between items-center'>
          <div className='text-2xl text-blue-600 dark:text-yellow-600 font-bold'>
            検索
          </div>
          <div>
            <i
              className='text-gray-600 fa-solid fa-xmark p-1 cursor-pointer hover:text-blue-600'
              onClick={closeModal}></i>
          </div>
        </div>

        <input
          type='text'
          placeholder='キーワードを入力してください...'
          onChange={e => handleInputChange(e)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          className='text-black dark:text-gray-200 bg-gray-50 dark:bg-gray-600 outline-blue-500 w-full px-4 my-2 py-1 mb-4 border rounded-md'
          ref={inputRef}
        />

        <div className='mb-4'>
          <TagGroups />
        </div>

        {searchResults.length === 0 && keyword && !isLoading && (
          <div>
            <p className=' text-slate-600 text-center my-4 text-base'>
              一致する結果が見つかりませんでした：
              <span className='font-semibold'>&quot;{keyword}&quot;</span>
            </p>
          </div>
        )}

        <ul className='flex-1 overflow-auto'>
          {searchResults.map((result, index) => (
            <li
              key={result.objectID}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onJumpSearchResult()}
              className={`cursor-pointer replace my-2 p-2 duration-100 
              rounded-lg
              ${activeIndex === index ? 'bg-blue-600 dark:bg-yellow-600' : ''}`}>
              <a
                className={`${activeIndex === index ? ' text-white' : ' text-black dark:text-gray-300 '}`}>
                {result.title}
              </a>
            </li>
          ))}
        </ul>

        <Pagination totalPage={totalPage} page={page} switchPage={switchPage} />

        <div className='flex items-center justify-between mt-2 sm:text-sm text-xs dark:text-gray-300'>
          <div>
            {totalHit > 0 && (
              <p>
                合計 {totalHit} 件の結果が見つかりました（{useTime} ms）
              </p>
            )}
          </div>
          <div className='text-gray-600 dark:text-gray-300 text-right'>
            <span>
              <i className='fa-brands fa-algolia'></i> Powered by Algolia
            </span>
          </div>
        </div>
      </div>

      <div
        onClick={closeModal}
        className='z-30 fixed top-0 left-0 w-full h-full flex items-center justify-center glassmorphism'
      />
    </div>
  )
}

function TagGroups() {
  const { tagOptions } = useGlobal()
  const firstTenTags = tagOptions?.slice(0, 10)

  return (
    <div id='tags-group' className='dark:border-gray-700 space-y-2'>
      {firstTenTags?.map((tag, index) => {
        return (
          <SmartLink
            passHref
            key={index}
            href={`/tag/${encodeURIComponent(tag.name)}`}
            className={'cursor-pointer inline-block whitespace-nowrap'}>
            <div
              className={
                'flex items-center text-black dark:text-gray-300 hover:bg-blue-600 dark:hover:bg-yellow-600 hover:scale-110 hover:text-white rounded-lg px-2 py-0.5 duration-150 transition-all'
              }>
              <div className='text-lg'>{tag.name} </div>
              {tag.count ? (
                <sup className='relative ml-1'>{tag.count}</sup>
              ) : (
                <></>
              )}
            </div>
          </SmartLink>
        )
      })}
    </div>
  )
}

function Pagination(props) {
  const { totalPage, page, switchPage } = props
  if (totalPage <= 0) {
    return <></>
  }
  return (
    <div className='flex space-x-1 w-full justify-center py-1'>
      {Array.from({ length: totalPage }, (_, i) => {
        const classNames =
          page === i
            ? 'font-bold text-white bg-blue-600 dark:bg-yellow-600 rounded'
            : 'hover:text-blue-600 hover:font-bold dark:text-gray-300'

        return (
          <div
            onClick={() => switchPage(i)}
            className={`text-center cursor-pointer w-6 h-6 ${classNames}`}
            key={i}>
            {i + 1}
          </div>
        )
      })}
    </div>
  )
}

import htmlTags from 'html-tags'
import voidHtmlTags from 'html-tags/void'

/**
 * List of tags having optional closing tag
 */
const optionalVoidHtmlTags = [
  'li',
]

const { min, max } = Math

class HtmlSubstringError extends Error {}

interface Options {
  breakWords: boolean
  suffix: (() => string) | string | null
}

const DEFAULT_OPTIONS: Options = {
  breakWords: true,
  suffix: null,
}

const isLetter = (input: string) => {
  return input.toLowerCase() !== input.toUpperCase()
}

const isWhitespace = (input: string) => {
  return ' \t\r\n'.includes(input)
}

const isVoidTag = (tag: string) => voidHtmlTags.indexOf(tag) !== -1
const isOptionalVoidTag = (tag: string) => optionalVoidHtmlTags.indexOf(tag) !== -1

const haveToHaveClosingTag = (tag: string) => !(isVoidTag(tag) || isOptionalVoidTag(tag))

/**
 * @param source Source HTML
 * @param length Visible characters (everything but HTML tags) limit
 * @param options Options object
 *
 * @returns stripped source by length characters
 */
export default function html_substring(
  source: string,
  length: number,
  options: Partial<Options> = DEFAULT_OPTIONS,
): string {
  const opts: Options = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let current = 0 // current text length
  let i = 0 // current source position
  const chars = Array.from(source) // Split the string to array of characters

  const openTag = (): [string, string] => {
    let tag = ''
    let other = ''
    let c: string

    while (true) {
      c = chars[i++]
      if (c === ' ' || c === '>') {
        break
      }

      tag += c
    }

    if (c !== '>') {
      other += ' '
      while (true) {
        c = chars[i++]
        if (c === '>') {
          break
        }

        other += c
      }
    }

    return [tag, other]
  }

  const closeTag = () => {
    let tag = ''
    let c
    while (true) {
      c = chars[i++]
      if (c === '>') {
        break
      }

      tag += c
    }

    return tag
  }

  let c: string // current character
  const openedQueue: Array<[string, string]> = [] // nonflushed open tags
  const closeQueue: string[] = [] // list of tags to be closed
  let result: string = ''

  const openTags = (onlyVoid: boolean = false) => {
    while (true) {
      const value = openedQueue.shift()
      if (!value) {
        break
      }

      const [tag, other] = value

      const isVoid = isVoidTag(tag)
      const isOptionalVoid = isOptionalVoidTag(tag)
      const isXHTMLClosed = other[other.length - 1] === '/'
      if (onlyVoid && !(isVoid || isXHTMLClosed)) {
        openedQueue.unshift([tag, other])
        break
      }

      result += '<'
      result += tag
      result += other
      result += '>'

      if (!(isVoid || isOptionalVoid || isXHTMLClosed)) {
        closeQueue.push(`</${tag}>`)
      }
    }
  }

  const cw: string[] = [] // current word
  let cwEmpty = true
  const flushWord = opts.breakWords
    ? () => {
        if (cw.length === 0) {
          return true
        }

        const addable = max(min(length - current, cw.length), 0)
        if (addable === 0) {
          return false
        }

        openTags()

        result += cw.slice(0, addable).join('')
        current += addable
        cw.splice(0, addable)

        return true
      }
    : () => {
        if (cw.length === 0) {
          return true
        }

        if (current + cw.length <= length) {
          openTags()

          result += cw.join('')
          current += cw.length
          cw.length = 0

          return true
        }

        return false
      }

  mainloop: while (current < length && i < chars.length) {
    c = chars[i++]

    switch (c) {
      case '<':
        if (!flushWord()) {
          break mainloop
        }

        // there's tag
        switch (chars[i]) {
          case '!': {
            if (chars[i + 1] === '-' && chars[i + 2] === '-') {
              // comment
              i += 2
              while (
                chars[i] !== '-' &&
                chars[i + 1] !== '-' &&
                chars[i + 2] !== '>'
              ) {
                result += chars[i++]
              }
              i += 2
            } else {
              ++current
              result += '<'
            }
            break
          }
          case '/': {
            // We should flush opened tags queue since we are going to close a tag just now
            openTags()

            const offset = i - 1
            ++i
            const tag = closeTag()
            let success = false

            // if the tag doesn't need to be closed, then just print it
            if (haveToHaveClosingTag(tag)) {
              while (closeQueue.length !== 0) {
                success = closeQueue.pop() === (`</${tag}>`)
                if (success) {
                  break
                }
              }

              if (!success) {
                throw new HtmlSubstringError(
                  `Unexpected closing tag '${tag}' on offset ${offset}`,
                )
              }
            }

            result += '</'
            result += tag
            result += '>'
            break
          }
          default: {
            // open tag
            openedQueue.push(openTag())
            break
          }
        }
        break

      case '&':
        const offset = i - 1
        result += '&'
        ++current

        while (i < chars.length) {
          const c = chars[i++]
          // result += c

          if (isWhitespace(c)) {
            i = offset + 1
            break
          }

          if (c === ';') {
            result += chars.slice(offset + 1, i).join('')
            break
          }
        }
        break

      default:
        if (!isLetter(c) && !cwEmpty) {
          cwEmpty = true
          if (!flushWord()) {
            break mainloop
          }
        }

        if (!isWhitespace(c)) {
          cwEmpty = false
        }
        cw.push(c)
    }
  }

  openTags(true)
  const flushed = flushWord()

  closeQueue.reverse()
  result = [result, ...closeQueue].join('')

  if (!flushed) {
    let suffix = opts.suffix
    if (suffix !== null) {
      if (typeof suffix === 'function') {
        suffix = suffix()
      }

      result += suffix
    }
  }

  return result
}

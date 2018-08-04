const { min, max } = Math

class HtmlSubstringError extends Error {}

interface Options {
  breakWords: boolean
}

const DEFAULT_OPTIONS: Options = {
  breakWords: true,
}

const isLetter = (input: string) => {
  return input.toLowerCase() !== input.toUpperCase()
}

const isWhitespace = (input: string) => {
  return ' \t\r\n'.includes(input)
}

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
  const opened: string[] = [] // opened tags stack
  let result: string = ''

  const openTags = () => {
    for (const [tag, other] of openedQueue) {
      result += '<'
      result += tag
      result += other
      result += '>'

      opened.push(tag)
    }
    openedQueue.length = 0
  }

  const cw: string[] = [] // current word
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
        cw.length = 0

        return true
      }
    : () => {
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
            const offset = i - 1
            ++i
            const tag = closeTag()
            let success = false

            while (opened.length !== 0) {
              success = opened.pop() === tag
              if (success) {
                break
              }
            }

            if (!success) {
              throw new HtmlSubstringError(
                `Unexpected closing tag '${tag}' on offset ${offset}`,
              )
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

        let success = false
        while (i < chars.length) {
          const c = chars[i++]
          result += c
          if (c === ';') {
            success = true
            break
          }
        }

        if (!success) {
          throw new HtmlSubstringError(
            `Expected matching ';' to '&' at offset ${offset}`,
          )
        }

        current++
        break

      default:
        if (!isLetter(c) && !isWhitespace(c)) {
          if (!flushWord()) {
            break mainloop
          }
        }
        cw.push(c)
    }
  }

  flushWord()

  for (const tag of opened) {
    result += '</'
    result += tag
    result += '>'
  }

  return result
}

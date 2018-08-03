class HtmlSubstringError extends Error {}

/**
 * @param source Source HTML
 * @param length Visible characters (everything but HTML tags) limit
 *
 * @returns stripped source by length characters
 */
export default function html_substring(source: string, length: number): string {
  let current = 0 // current text length
  let i = 0 // current source position
  const chars = Array.from(source) // Split the string to array of characters

  const openTag = () => {
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
  const opened: string[] = [] // opened tags stack
  let result: string = ''

  while (current < length && i < chars.length) {
    c = chars[i++]

    switch (c) {
      case '<':
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
              throw new HtmlSubstringError(`Unexpected closing tag '${tag}' on offset ${offset}`)
            }

            result += '</'
            result += tag
            result += '>'
            break
          }
          default: {
            // open tag
            const [tag, other] = openTag()
            result += '<'
            result += tag
            result += other
            result += '>'

            opened.push(tag)
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
          throw new HtmlSubstringError(`Expected matching ';' to '&' at offset ${offset}`)
        }

        current++
        break

      default:
        result += c
        ++current
    }
  }

  for (const tag of opened) {
    result += '</'
    result += tag
    result += '>'
  }

  return result
}

import { expect } from 'chai'
import 'mocha'

import html_substring from '../src/main'

describe('html_substring', () => {
  describe('normal text', () => {
    it('should not strip when length is greater than text ', () => {
      const result = html_substring('Some text', 9)
      expect(result).to.eq('Some text')
    })

    it('should strip normal text', () => {
      const result = html_substring('lorem ipsum lorem ipsum lorem ipsum', 13)
      expect(result).to.eq('lorem ipsum l')
    })
  })

  describe('simple html text', () => {
    it('should not strip html when length is greater than length of actual text', () => {
      const result = html_substring('<div>Hello World</div>', 11)
      expect(result).to.eq('<div>Hello World</div>')
    })

    it('should strip html', () => {
      const result = html_substring('<div>Hello World</div>', 8)
      expect(result).to.eq('<div>Hello Wo</div>')
    })

    it('should close open tags', () => {
      const result = html_substring(
        '<span><div>Hello</div> <p>World</p></span>',
        6,
      )
      expect(result).to.eq('<span><div>Hello</div> </span>')
    })

    it('should detect wrong tag pairs order', () => {
      expect(() => html_substring(
        '<span><div>Hello World</span> Some</div> other text',
        27,
      )).to.throw('Unexpected closing tag \'div\' on offset 34')
    })
  })

  describe('advanced html text', () => {
    it('should not strip html when length is greater than length of actual text', () => {
      const result = html_substring(
        '<p style="font-size: 20">Hello World</p>',
        11,
      )
      expect(result).to.eq('<p style="font-size: 20">Hello World</p>')
    })

    it('should strip html', () => {
      const result = html_substring('<div>Hello World</div>', 8)
      expect(result).to.eq('<div>Hello Wo</div>')
    })

    it('should close open tags', () => {
      const result = html_substring(
        '<span><div>Hello</div> <p>World</p></span>',
        6,
      )
      expect(result).to.eq('<span><div>Hello</div> </span>')
    })
  })

  describe('html entities', () => {
    it('should strip counting a single entity as a single character', () => {
      const result = html_substring('&lt;&lt;&lt;&lt;&lt;&lt;&lt;', 5)
      expect(result).to.eq('&lt;&lt;&lt;&lt;&lt;')
    })

    it('should throw error when entity is not closed', () => {
      expect(() => {
        html_substring('15 &lt 30', 10)
      }).to.throw('Expected matching \';\' to \'&\' at offset 3')
    })
  })

  describe('word breaking', () => {
    it('should assume that whitespace is a prefix of word', () => {
      const result = html_substring('<div><span>Hello</span><span> World</span></div>', 7, {
        breakWords: false,
      })

      expect(result).to.eq('<div><span>Hello</span></div>')
    })

    it('should not break words with tags', () => {
      const result = html_substring('<div><span>Hello</span> <span>World</span></div>', 7, {
        breakWords: false,
      })

      expect(result).to.eq('<div><span>Hello</span> </div>')
    })
  })
})

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

    it('should work with symbol entities', () => {
      const result = html_substring('&#913;&#913;&#913;&#913;&#913;&#913;', 2)
      expect(result).to.eq('&#913;&#913;')
    })

    it('should consider non-closed entity as normal text', () => {
      const result = html_substring('&trade ', 3)
      expect(result).to.eq('&tr')
    })

    it('should consider non-closed entity as normal text #2', () => {
      const result = html_substring('& hello world ', 10)
      expect(result).to.eq('& hello wo')
    })

    it('should work with entities among normal text', () => {
      const result = html_substring('K&amp;M', 1000)
      expect(result).to.eq('K&amp;M')
    })

    it('should work with entities among normal text #2', () => {
      const result = html_substring('Hello&amp;World', 1000)
      expect(result).to.eq('Hello&amp;World')
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

  describe('suffix', () => {
    it('should not add suffix when text fits limit', () => {
      const result = html_substring('<p>Hello, my friend</p>', 16, {
        suffix: '...',
      })

      expect(result).to.eq('<p>Hello, my friend</p>')
    })

    it('should add suffix', () => {
      const result = html_substring('<p>Hello, my friend</p>', 15, {
        suffix: '...',
      })

      expect(result).to.eq('<p>Hello, my frien</p>...')
    })

    it('should add suffix if word is broken', () => {
      const result = html_substring('<div><span>Hello</span> <span>World</span></div>', 7, {
        suffix: '...',
      })

      expect(result).to.eq('<div><span>Hello</span> <span>W</span></div>...')
    })

    it('should add suffix when word breaking is off', () => {
      const result = html_substring('<div><span>Hello</span> <span>World</span></div>', 7, {
        breakWords: false,
        suffix: '...',
      })

      expect(result).to.eq('<div><span>Hello</span> </div>...')
    })

    it('should not add suffix to empty input', () => {
      const result = html_substring('', 5, {
        suffix: '...',
      })

      expect(result).to.eq('')
    })

    it('should use suffix as callable', () => {
      const result = html_substring('<p>Hello, my friend</p>', 15, {
        suffix: () => '...',
      })

      expect(result).to.eq('<p>Hello, my frien</p>...')
    })
  })

  describe('combined', () => {
    it('should work right with big text', () => {
      const result = html_substring(
        'Therefore television ring stone invented discovery known third quiet. Ever source exciting science tears ' +
        'breathe continent rear. Diameter faster goes somewhere met tie. Silk never army younger shop guess corn ' +
        'log. Eye mirror diameter dust field lovely regular speech. Tax stage out easy origin ancient frame. Hidden ' +
        'food happen certainly somehow avoid second plenty sometime select rock far. Newspaper signal clear aid ' +
        'happy held. Sound eager hurry shoe push tongue army strength offer studied huge lamp. Independent rhythm in ' +
        'were cross visit thick stop man bicycle exact rapidly. Seven move mighty bark addition pitch lake. Term '
        + 'against cloud onto worse hurry principle topic felt press see.',
        40,
        { breakWords: false, suffix: '...' },
      )
      expect(result).to.eq('Therefore television ring stone invented...')
    })
  })

  describe('tags without content', () => {
    it('should work with no content in the tag', () => {
      const result = html_substring('hi <strong></strong> John Doe', 100)

      expect(result).to.eq('hi <strong></strong> John Doe')
    })

    it('should work with html only content in the tag', () => {
      const result = html_substring('hi <strong><br></strong> John Doe', 100)

      expect(result).to.eq('hi <strong><br></strong> John Doe')
    })

    it('should strip empty tags at the end', () => {
      const result = html_substring('I am okay <strong><br></strong>', 10)

      expect(result).to.eq('I am okay ')
    })
  })

  describe('void tags', () => {
    it('should not generate a closing tag for void tags', () => {
      const result = html_substring('hi<hr>John <input> Doe', 100)

      expect(result).to.eq('hi<hr>John <input> Doe')
    })

    it('should work fine for li without closing tag', () => {
      const result = html_substring('<ul><li>Hello<li>Who<li>is<li>John<li>Doe</ul>', 10)

      expect(result).to.eq('<ul><li>Hello<li>Who<li>is</ul>')
    })

    it('should work fine for li with closing tag', () => {
      const result = html_substring('<ul><li>Hello</li><li>Who</li><li>is</li><li>John</li><li>Doe</li></ul>', 10)

      expect(result).to.eq('<ul><li>Hello</li><li>Who</li><li>is</li></ul>')
    })
  })

  describe('xhtml tags', () => {
    it('should not close non-void xhtml tags', () => {
      const result = html_substring('abc <div class="mydiv" />', 15)

      expect(result).to.eq('abc <div class="mydiv" />')
    })

    it('should not close void xhtml tags', () => {
      const result = html_substring('Name: <input type="text" value="Hello" />', 15)

      expect(result).to.eq('Name: <input type="text" value="Hello" />')
    })

    it('should work normal with text after tag', () => {
      const result = html_substring('test <br /> test lorem ipsum', 10)

      expect(result).to.eq('test <br /> test')
    })

    it('should work normal with small tags (without spaces between tag name and slash)', () => {
      const result = html_substring('test <br/> test lorem ipsum', 10)

      expect(result).to.eq('test <br/> test')
    })
  })

  describe('unclosed tag name', () => {
    it('should work with \'<\' as input', () => {
      const result = html_substring('<', 50)

      expect(result).to.eq('<')
    })

    it('should work with \'<div\' as input', () => {
      const result = html_substring('<div', 50)

      expect(result).to.eq('<div')
    })

    it('should work with \'<div \' as input', () => {
      const result = html_substring('<div ', 50)

      expect(result).to.eq('<div ')
    })

    it('should work with \'<div abc\' as input', () => {
      const result = html_substring('<div abc', 50)

      expect(result).to.eq('<div abc')
    })

    it('should work with \'test <div abc\' as input', () => {
      const result = html_substring('test <div abc', 50)

      expect(result).to.eq('test <div abc')
    })

    it('should work with \'test hello <div <h1\' as input', () => {
      const result = html_substring('test hello <div <h1', 50)

      expect(result).to.eq('test hello <div <h1')
    })

    it('should work with \'<div<h1> word\' as input', () => {
      const result = html_substring('<div<h1> word', 50)

      expect(result).to.eq('<div<h1> word</div>')
    })

    it('should work with this strange test', () => {
      const result = html_substring('>>>\_(*L*)_/<<>>>\_(*L*)_/<<', 50)

      expect(result).to.eq('>>>\_(*L*)_/<<>>>\_(*L*)_/<<')
    })
  })
})

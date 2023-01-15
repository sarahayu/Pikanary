(function() {

    fetch('https://random-word-api.herokuapp.com/word?number=4')
        .then(res => res.json())
        .then(words => {
            
            words.push(...shuffle([
                'repatriate',
                'acumen',
                'prodigal',
                'foist',
                'hubris',
                'gauche',
                'progenitor',
                'sulk',
                'miscreant',
                'emporium',
                'irk',
                'vexing',
                'riffraff',
                'derelict',
                'pentecostal',
                'collation',
                'errant',
                'jaunt',
                'magnate',
                'quintessence',
                'tandem',
                'slag',
                'gestate',
                'prehensile',
                'quaternary',
                'disparate',
                'excise',
                'laymans',
                'unfettered',
                'irate',
                'quibble',
                'iota',
                'tripe',
                'providence',
                'magnanimous',
                'whet',
            ]).slice(0, 6))

            words = shuffle(words)
            
            const exwords = document.querySelector('.example-words')

            words.forEach(word => {
                const wordButton = document.createElement('button')
                wordButton.textContent = word
                wordButton.addEventListener('click', () => lookUpWordInfo(word))
                exwords.appendChild(wordButton)
            })
        })


    document.querySelectorAll('.search-container input').forEach(searcher => {
        searcher.addEventListener('input', changeListener)
        searcher.addEventListener('focus', changeListener)
        searcher.addEventListener('blur', ev => {
            (function(target) {            
                setTimeout(() => exitInput(target), 200)
            })(ev.currentTarget)
        })
    })

    let searchUp, currentQuery = ''

    const wordDefs = document.querySelector('.word-defs'),
        wordDefTemplate = document.querySelector('#word-def-template'),
        resultTemplate = document.querySelector('#result-template'),
        vidGameLineSection = document.querySelector('.vid-game-lines'),
        vidGameLineResults = vidGameLineSection.querySelector('.results'),
        normalLineSection = document.querySelector('.normal-lines'),
        normalLineResults = normalLineSection.querySelector('.results'),
        normalLineSadSection = document.querySelector('.results-not-found'),
        normalLineResultsSad = normalLineSadSection.querySelector('.results'),
        silverLiningMsg = normalLineSadSection.querySelector('.silver-lining-msg')

    function changeListener(ev)
    {
        if (ev.currentTarget.value.length >= 3 && !searchUp)
        {
            searchWord(ev.currentTarget)
        }

    }

    function exitInput(inputElement)
    {
        inputElement.classList.remove('has-results')
        inputElement.parentElement.children[1].textContent = ''
        clearTimeout(searchUp)
        searchUp = null
        currentQuery = ''
    }

    function searchWord(inputElement)
    {
        if (currentQuery != inputElement.value)
        {
            currentQuery = inputElement.value

            if (currentQuery == '')
            {
                exitInput(inputElement)
                return
            }            

            inputElement.classList.add('has-results')
            console.log('changed')
            const results = inputElement.parentElement.children[1]
            results.textContent = ''

            fetch(`https://en.wiktionary.org/w/api.php?action=opensearch&format=json&origin=*&search=${escape(currentQuery)}`)
                .then(res => res.json())
                .then(res => {
                    if (inputElement.classList.contains('has-results'))
                    {
                        results.textContent = ''
                        const possibilities = res[1]
                        for (let i = 0; i < 4 && i < possibilities.length; i++)
                        {
                            const word = possibilities[i]
                            const button = document.createElement('button')
                            button.textContent = word
                            button.addEventListener('click', () => {
                                lookUpWordInfo(word)
                            })
                            results.appendChild(button)
                        }

                        if (possibilities.length == 0)
                        {                            
                            const noresults = document.createElement('span')
                            noresults.textContent = 'No results'
                            results.appendChild(noresults)
                        }
                        
                    }
                })
            
            const loading = document.createElement('span')
            loading.textContent = 'Loading...'
            results.appendChild(loading)
    
            searchUp = setTimeout(() => searchWord(inputElement), 2000)
        }
        else
        {
            searchUp = null
        }
    }

    function lookUpWordInfo(word)
    {
        document.body.classList.add('loading')

        console.log('getting quotes for', word)
        let definitions, inflections = []
        fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${escape(word)}?key=e6f8bf7f-029d-4548-8dbd-500ba65147c0`)
            .then(res => res.json())
            .then(async res => {
                console.log('got dictionary api result')
                definitions = res

                if (typeof(definitions[0]) == 'string')
                {
                    const res_1 = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${escape(definitions[0])}?key=e6f8bf7f-029d-4548-8dbd-500ba65147c0`)
                    definitions = await res_1.json()
                }

                if (!(definitions[0] && definitions[0].meta))
                    throw new Error('Unknown error!')

                definitions.forEach(defn => (defn.meta.stems || []).forEach(stem => {
                    if (!inflections.includes(stem.toLocaleLowerCase()))
                            inflections.push(stem.toLocaleLowerCase())
                }))

                if (inflections.length == 0) throw new Error('No inflections found!')
                
                return Promise.all([
                    fetch(`//pikanary-api.onrender.com/scripts?words=${inflections.join(',')}`),
                    fetch(`//pikanary-api.onrender.com/translate?words=${definitions.map(worddef => worddef.meta.id.split(':')[0]).join(',')}`),
                ])
            })
            .then(res => Promise.all(res.map(ress => ress.json())))
            .then(([vidGameRes, translations]) => {
                
                vidGameLineSection.classList.remove('show')
                normalLineSection.classList.remove('show')
                normalLineSadSection.classList.remove('show')

                silverLiningMsg.textContent = '...and it looks like the internet is pretty quiet too 0.o'

                vidGameLineResults.textContent = ''
                normalLineResults.textContent = ''
                normalLineResultsSad.textContent = ''
                
                wordDefs.textContent = ''

                let anyResults = false
 
                if (Object.values(vidGameRes).find(wordStem => Object.keys(wordStem).length != 0))
                    anyResults = true

                const normalResSection = anyResults ? normalLineSection : normalLineSadSection,
                    normalResDiv = anyResults ? normalLineResults : normalLineResultsSad

                if (!anyResults)
                    normalLineSadSection.classList.add('show')

                // console.log(vidGameRes, translations)

                definitions.slice(0, 3).forEach(worddef => {
                    const defn = worddef.shortdef.join('; '), quotes = worddef.quotes

                    if (defn)
                    {
                        const word = worddef.meta.id.split(':')[0]
                        const type = worddef.fl

                        const defcard = wordDefTemplate.content.lastElementChild.cloneNode(true)
                        defcard.querySelector('h2').textContent = word
                        defcard.querySelector('.type').textContent = type
                        defcard.querySelector('.def').textContent = defn
                        defcard.querySelector('.translation').textContent = '- Translation: ' + translations[word].direct + ' (' + translations[word].pronunciation + ')'

                        const syn = worddef.syns

                        if (syn)
                        {
                            const sims = defcard.querySelector('.similar-words')
                            sims.textContent = 'Similar words: '
                            console.log(syn[0].pt[0][1])
                            for (const possibleSyn of syn[0].pt[0][1].split(' '))
                            {
                                if (!possibleSyn.startsWith('{sc}')) break
                                const synonym = possibleSyn.slice(4, -5)
                                const synSpan = document.createElement('button')
                                synSpan.textContent = synonym
                                synSpan.addEventListener('click', () => lookUpWordInfo(synonym))
                                sims.appendChild(synSpan)
                            }
                        }

                        wordDefs.appendChild(defcard)
                    }

                    if (quotes)
                    {
                        normalResSection.classList.add('show')
                        silverLiningMsg.textContent = '...but here are some results from non-video game lines :,3'

                        for (let i = 0; i < quotes.length && i < 2; i++)
                        {
                            const newResult = resultTemplate.content.lastElementChild.cloneNode(true)

                            if (quotes[i].aq)
                            {
                                let parts = []
                                if (quotes[i].aq.auth)
                                    parts.push(quotes[i].aq.auth)
                                if (quotes[i].aq.source)
                                    parts.push(`<span class="source">${quotes[i].aq.source.slice(4, -5)}</span>`)
                                parts = [ parts.join(' | ') ]

                                if (quotes[i].aq.aqdate)
                                    parts.push(quotes[i].aq.aqdate)
                                parts = parts.join(' - ')
                                
                                newResult.querySelector('span').innerHTML = parts
                            }

                            newResult.querySelector('p').innerHTML = quotes[i].t.replaceAll('{qword}', '<span class="word">').replaceAll('{/qword}', '</span>')

                            normalResDiv.appendChild(newResult)
                        }
                    }
                })

                document.querySelectorAll('.word').forEach(wordSpan => wordSpan.textContent = word)

                if (anyResults)
                {
                    vidGameLineSection.classList.add('show')

                    let uniqueIDS = []

                    Object.entries(vidGameRes).sort((a, b) => b[0].length - a[0].length).forEach(([_, gameResults]) => {
                        shuffle(Object.entries(gameResults)).forEach(([gameName, quotes]) => {
                            for (let i = 0, uniques = 0; i < quotes.length && uniques < 2; i++)
                            {
                                if (!uniqueIDS.includes(quotes[i].id))
                                {
                                    uniqueIDS.push(quotes[i].id)
                                    uniques++
                                    
                                    if (uniqueIDS.length < 5)
                                    {
                                        const newResult = resultTemplate.content.lastElementChild.cloneNode(true)
                                        let speaker = `<span class="source">${gameName}</span>`
                                        if (quotes[i].speaker != 'UNKNOWN') speaker = quotes[i].speaker + ' | ' + speaker
        
                                        newResult.querySelector('span').innerHTML = speaker
        
                                        let quote = quotes[i].quote
                                        quote = quote.replaceAll('\\n', '<br>').replaceAll('{qword}', '<span class="word">').replaceAll('{/qword}', '</span>')
        
                                        newResult.querySelector('p').innerHTML = quote
        
                                        vidGameLineResults.appendChild(newResult)
                                    }
                                }
                            }
                        })
                    })
                    
                    document.querySelector('.amount').textContent = uniqueIDS.length
                }

                document.body.classList.add('exit-landing')
                document.body.classList.remove('loading')
            })
    }

    function shuffle(arr) 
    {
        for (let i = 0; i < arr.length; i++)
        {
            let j = Math.floor(Math.random() * (arr.length - i - 2)) + i + 1;
            let a = arr[i];
            arr[i] = arr[j];
            arr[j] = a;
        }

        return arr
    }
})()
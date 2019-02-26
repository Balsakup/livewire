export default {
    onMessage: null,
    lastTimeARequestWasSent: null,

    init() {
        //
    },

    sendMessage(payload, minWait) {
        var timestamp = (new Date()).valueOf();
        this.lastTimeARequestWasSent = timestamp;

        // @todo - Figure out not relying on app's csrf stuff in bootstrap.js
        const token = document.head.querySelector('meta[name="csrf-token"]').content

        Promise.all([
            fetch('/livewire/message', {
                method: 'POST',
                body: JSON.stringify(payload),
                // This enables "cookies".
                credentials: "same-origin",
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'text/html, application/xhtml+xml',
                    // "Accept": "application/json, text-plain, */*",
                },
            }),
            new Promise(resolve => setTimeout(resolve, minWait || 0)),
        ]).then(([response]) => {
            if (timestamp < this.lastTimeARequestWasSent) {
                return
            }

            window.response = response

            if (response.ok) {
                response.text().then(response => {
                    this.onMessage.call(this, JSON.parse(response))
                })
            } else {
                response.text().then(response => {
                    this.showHtmlModal(response)
                })
            }
        })
            // @todo: catch 419 session expired.
    },

    // This code and concept is all Jonathan Reinink - thanks main!
    showHtmlModal(html) {
        let page = document.createElement('html')
        page.innerHTML = html
        page.querySelectorAll('a').forEach(a => a.setAttribute('target', '_top'))

        let modal = document.createElement('div')
        modal.id = 'burst-error'
        modal.style.position = 'fixed'
        modal.style.width = '100vw'
        modal.style.height = '100vh'
        modal.style.padding = '50px'
        modal.style.backgroundColor = 'rgba(0, 0, 0, .6)'
        modal.style.zIndex = 200000

        let iframe = document.createElement('iframe')
        iframe.style.backgroundColor = 'white'
        iframe.style.borderRadius = '5px'
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        modal.appendChild(iframe)

        document.body.prepend(modal)
        document.body.style.overflow = 'hidden'
        iframe.contentWindow.document.open()
        iframe.contentWindow.document.write(page.outerHTML)
        iframe.contentWindow.document.close()

        // Close on click.
        modal.addEventListener('click', () => this.hideHtmlModal(modal))

        // Close on escape key press.
        modal.setAttribute('tabindex', 0)
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hideHtmlModal(modal) })
        modal.focus()
    },

    hideHtmlModal(modal) {
        modal.outerHTML = ''
        document.body.style.overflow = 'visible'
    }
}

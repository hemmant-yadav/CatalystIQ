function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const toolbarLinks = ['Discovery', 'Synthetic Biology', 'Feedback', 'Collaboration', 'Settings']
const navLinks = ['Features', 'Solutions', 'Plans']

function Navbar() {
  return (
    <header>
      <div className="w-full flex items-center justify-center gap-6 py-2 px-8 bg-white/[0.03] text-xs text-foreground/50">
        {toolbarLinks.map((link) => (
          <button key={link} className="hover:text-foreground/80 transition">
            {link}
          </button>
        ))}
      </div>

      <div className="w-full flex items-center justify-between py-5 px-8">
        <div
          className="font-headline text-2xl font-semibold bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}
        >
          CatalystIQ
        </div>

        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link}
              className="text-foreground/90 hover:text-foreground transition flex items-center gap-1"
            >
              {link}
              <ChevronDown />
            </button>
          ))}
        </div>

        <button className="heroSecondary px-4 py-2">
          Sign Up
        </button>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  )
}

export default Navbar

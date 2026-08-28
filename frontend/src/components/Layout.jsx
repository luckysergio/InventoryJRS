import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 flex overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-4 transition-all duration-300">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  MenuIcon, 
  XIcon, 
  UserCircleIcon, 
  LogoutIcon,
  CogIcon
} from '@heroicons/react/outline';

const Navbar = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">ChatApp</h1>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center">
            {user && (
              <div className="ml-4 flex items-center space-x-4">
                <div className="text-gray-700 dark:text-gray-200">
                  Welcome, {user.username}
                </div>
                
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center">
                    <UserCircleIcon className="h-8 w-8 text-gray-600 hover:text-primary" />
                  </Menu.Button>
                  
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                          >
                            <CogIcon className="w-5 h-5 mr-3" />
                            Settings
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={onLogout}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                          >
                            <LogoutIcon className="w-5 h-5 mr-3" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              {isMobileMenuOpen ? (
                <XIcon className="block h-6 w-6" />
              ) : (
                <MenuIcon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Transition
        show={isMobileMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user && (
              <>
                <div className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  Welcome, {user.username}
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <CogIcon className="w-5 h-5 inline mr-3" />
                  Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogoutIcon className="w-5 h-5 inline mr-3" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar; 
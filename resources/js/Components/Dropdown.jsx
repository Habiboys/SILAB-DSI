// import { Transition } from '@headlessui/react';
// import { Link } from '@inertiajs/react';
// import { createContext, useContext, useState } from 'react';

// const DropDownContext = createContext();

// const Dropdown = ({ children }) => {
//     const [open, setOpen] = useState(false);

//     const toggleOpen = () => {
//         setOpen((previousState) => !previousState);
//     };

//     return (
//         <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
//             <div className="relative">{children}</div>
//         </DropDownContext.Provider>
//     );
// };

// const Trigger = ({ children }) => {
//     const { open, setOpen, toggleOpen } = useContext(DropDownContext);

//     return (
//         <>
//             <div onClick={toggleOpen}>{children}</div>

//             {open && (
//                 <div
//                     className="fixed inset-0 z-40"
//                     onClick={() => setOpen(false)}
//                 ></div>
//             )}
//         </>
//     );
// };

// const Content = ({
//     align = 'right',
//     width = '48',
//     contentClasses = 'py-1 bg-base-100',
//     children,
// }) => {
//     const { open, setOpen } = useContext(DropDownContext);

//     let alignmentClasses = 'origin-top';

//     if (align === 'left') {
//         alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
//     } else if (align === 'right') {
//         alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
//     }

//     let widthClasses = '';

//     if (width === '48') {
//         widthClasses = 'w-48';
//     }

//     return (
//         <>
//             <Transition
//                 show={open}
//                 enter="transition ease-out duration-200"
//                 enterFrom="opacity-0 scale-95"
//                 enterTo="opacity-100 scale-100"
//                 leave="transition ease-in duration-75"
//                 leaveFrom="opacity-100 scale-100"
//                 leaveTo="opacity-0 scale-95"
//             >
//                 <div
//                     className={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
//                     onClick={() => setOpen(false)}
//                 >
//                     <div
//                         className={
//                             `rounded-md ring-1 ring-black ring-opacity-5 ` +
//                             contentClasses
//                         }
//                     >
//                         {children}
//                     </div>
//                 </div>
//             </Transition>
//         </>
//     );
// };

// const DropdownLink = ({ className = '', children, ...props }) => {
//     return (
//         <Link
//             {...props}
//             className={
//                 'block w-full px-4 py-2 text-start text-sm leading-5 text-base-content transition duration-150 ease-in-out hover:bg-base-200 focus:bg-base-200 focus:outline-none ' +
//                 className
//             }
//         >
//             {children}
//         </Link>
//     );
// };

// Dropdown.Trigger = Trigger;
// Dropdown.Content = Content;
// Dropdown.Link = DropdownLink;

// export default Dropdown;
import React, { useState, useEffect, useRef } from 'react';

const Dropdown = ({ trigger, items, width = "w-56", align = "right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`${width} absolute ${align === "right" ? "right-0" : "left-0"} mt-2 bg-base-100 border rounded-lg shadow-lg py-1 z-50`}
        >
          {items}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
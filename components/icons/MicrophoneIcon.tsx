import React from 'react';

interface MicrophoneIconProps {
  className?: string;
}

const MicrophoneIcon: React.FC<MicrophoneIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0v-.5a.5.5 0 01.5-.5zM8 15a.5.5 0 00-.5.5v.5a.5.5 0 001 0v-.5A.5.5 0 008 15zm-2.5-4.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0v-.5a.5.5 0 01.5-.5zM15 10a.5.5 0 00-.5.5v.5a.5.5 0 001 0v-.5a.5.5 0 00-.5-.5zM4 10a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
    <path d="M3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm14 0a1 1 0 00-1-1h-1a1 1 0 100 2h1a1 1 0 001-1z" />
    <path d="M10 18a8 8 0 005.932-2.855c.23-.264.133-.68-.196-.82l-3.32-1.423a.852.852 0 00-.992.176l-.938.938a.85.85 0 01-1.2 0l-.938-.938a.852.852 0 00-.992-.176L3.264 14.325c-.33.14-.426.556-.196.82A8 8 0 0010 18z" />
  </svg>
);

export default MicrophoneIcon;
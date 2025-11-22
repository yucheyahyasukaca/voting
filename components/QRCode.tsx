'use client'

import dynamic from 'next/dynamic'

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
})

interface QRCodeProps {
  value: string
  size?: number
}

export default function QRCode({ value, size = 256 }: QRCodeProps) {
  return <QRCodeSVG value={value} size={size} />
}


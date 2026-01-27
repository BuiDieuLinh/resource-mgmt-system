import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme='light' theme={{ primaryColor: 'blue' }}>
      <RouterProvider router={router} />    
    </MantineProvider>
  </StrictMode>,
)

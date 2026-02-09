import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from 'react-router-dom'
import { Notifications } from '@mantine/notifications';
import { router } from './routes'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from "./lib/react-query";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme='light' theme={{ primaryColor: 'blue' }}>
        <Notifications position="top-right"/>
        <RouterProvider router={router} />    
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)

import type { ServerComponentProps } from 'payload'

import styles from './BeforeDashboardServer.module.css'

export const BeforeDashboardServer = async (_props: ServerComponentProps) => {
  return (
    <div className={styles.wrapper}>
      <h1>Added by the plugin: Before Dashboard Server</h1>
    </div>
  )
}

import styles from './CvAddress.module.css'

type CvAddressProps = {
  /** The entry's stable id — shown verbatim, because this is what the
      matching and the chat cite when they point back into the document. */
  id: string
}

export function CvAddress({id}: CvAddressProps) {
  return (
    <p className={styles.root}>
      <span className={styles.tick} aria-hidden="true" />
      <span className={styles.id}>{id}</span>
    </p>
  )
}

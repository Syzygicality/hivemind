import './NotebookList.css'

export default function NotebookList() {
  const notebooks = ['Math Notes', 'Chemistry Notes', 'History Notes']

  return (
    <div className="notebook-list-simple">
      <ul className="notebook-list">
        {notebooks.map((n) => (
          <li key={n} className="notebook-item">
            {n}
          </li>
        ))}
      </ul>
    </div>
  )
}

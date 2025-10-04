import './NotebookList.css'
import mockNotebooks from '../data/mockNotebooks'
import NotebookItem from './NotebookItem'

export default function NotebookList() {
  const notebooks = mockNotebooks

  return (
    <div className="notebook-list-simple">
      <ul className="notebook-list">
        {notebooks.map((nb) => (
          <li key={nb.notebook_id}>
            <NotebookItem notebook={nb} />
          </li>
        ))}
      </ul>
    </div>
  )
}

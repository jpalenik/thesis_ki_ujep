/**
 * 
 */

import nodegit from 'nodegit'
import path from 'path'
import fsx from 'fs-extra'

const GIT_REPO_USER = 'user'
const GIT_REPO_EMAIL = 'user@email.com'


const repoDir = 'GIT_REPO_PATH'
const dataBase = 'GIT_REPO_PROJ_PATH'

/**
 * Commit data
 * @param project_id
 * @param dataset_id
 * @param model_id
 * @param data
 * @param name
 * @param email
 * @param message
 * @param commit
 * @returns {Promise<Oid>}
 */
export const commit = async (project_id, dataset_id, model_id, data, name, email, message) => {
  const file = path.join(repoDir, dataBase, project_id.toString(), dataset_id.toString(), `${model_id.toString()}.json`)

  const repo = await nodegit.Repository.open(path.join(repoDir, '.git'))
  await fsx.ensureDir(path.dirname(file))
  await fsx.writeFile(file, JSON.stringify(data))
  const index = await repo.refreshIndex()
  await index.addByPath(path.join(dataBase, project_id.toString(), dataset_id.toString(), `${model_id.toString()}.json`))
  await index.write()
  const oid = await index.writeTree()
  const h = await nodegit.Reference.nameToId(repo, 'HEAD')
  const parent = await repo.getCommit(h)

  const author = await nodegit.Signature.now(name, email)
  const committer = await nodegit.Signature.now(
    GIT_REPO_USER,
    GIT_REPO_EMAIL)
  const created = await repo.createCommit('HEAD', author, committer, message, oid, [parent])
  return created.tostrS()
}

export const read = async (project_id, dataset_id, model_id, commit_hash) => {
  /**
   * If commit parameter is set, get version from specified commit
   */
  if (commit_hash) {
    let entry = null
    try {
      const repo = await nodegit.Repository.open(path.join(repoDir, '.git'))
      const commit = await repo.getCommit(commit_hash)
      entry = await commit.getEntry(`${dataBase}/${project_id}/${dataset_id}/${model_id}.json`)
      const blob = await entry.getBlob()
      return JSON.parse(blob.toString())
    } catch (err) {
      console.error(`could not find entry of ${dataBase}/${project_id}/${dataset_id}/${model_id}.json, coomit_hash ${commit_hash}`, err)
      return null
    }
  }
  
  /**
   * Return newest version of file
   */
  try {
    const file = path.join(repoDir, dataBase, project_id.toString(), dataset_id.toString(), `${model_id.toString()}.json`)
    await fsx.ensureFile(file)
    let data = await fsx.readFile(file, { encoding: 'utf-8' })
    if (!data.length) {
      data = []
    }
    return data
  } catch (err) {
    console.log(err)
    return {}
  }   
}

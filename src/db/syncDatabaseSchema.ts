/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import * as fs from 'fs'
import * as path from 'path'

import { Client } from 'pg'

import databaseConfiguration from './databaseConfiguration'

export default async function syncDatabaseSchema(): Promise<void> {
  // Define the list of directories holding '*.sql' files, in the order we want to execute them
  const sqlDirectories = [
    'extensions',
    'schema',
    'functions',
    'triggers',
    'seed',
  ]

  // Loop through directories holding SQL files and execute them against the database
  for (const directory of sqlDirectories) {
    const files = fs.readdirSync(path.join(__dirname, directory))

    // Note that this loops through the files in alphabetical order
    for (const file of files) {
      await executeSQLFile(path.join(__dirname, directory, file))
    }
  }

  /*
   * HELPER FUNCTIONS
   */
  async function executeSQLFile(file: string): Promise<void> {
    const sql = fs.readFileSync(file, 'utf8')

    // Connect to the database
    const client = new Client(databaseConfiguration)
    client.connect()

    console.log(`Executing query:\n${sql}`)
    await client.query(sql).catch((err: Error) => {
      console.error('error running query', file, err.message)

      // If we can't execute our SQL, our app is in an indeterminate state, so kill it.
      process.exit(1)
    })

    // Close the database connection
    client.end()
  }
}
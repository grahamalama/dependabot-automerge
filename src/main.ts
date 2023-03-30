import * as core from '@actions/core'
import * as github from '@actions/github'

function parseSemverLevel(input: string): string {
  const semver = input.split('version-update:semver-').pop()
  if (!semver) {
    throw new Error(`Invalid semver-level input: ${semver}"`)
  }
  return semver
}

function parseDependencyType(input: string): string {
  const dependencyType = input.split('direct:').pop()
  if (!dependencyType) {
    throw new Error(`Invalid dependency-type input: ${dependencyType}"`)
  }
  return dependencyType
}
function parseAutoApprovals(input: string): string[] {
  return input.split(',')
}

type MergeStrategy = 'merge' | 'squash' | 'rebase'
export function parseMergeStrategy(input: string): MergeStrategy {
  if (!['merge', 'squash', 'rebase'].includes(input)) {
    throw new Error(`Invalid merge-strategy input: ${input}"`)
  }
  // TODO remove cast
  return input as MergeStrategy
}

async function run(): Promise<void> {
  try {
    {
      const semverLevel = parseSemverLevel(core.getInput('semver-level'))
      const dependencyType = parseDependencyType(
        core.getInput('dependency-type')
      )
      const mergeStrategy = parseMergeStrategy(core.getInput('merge-strategy'))
      const prodDepSemverAutoapprove = parseAutoApprovals(
        core.getInput('prod-dep-semver-autoapprove')
      )
      const devDepSemverAutoapprove = parseAutoApprovals(
        core.getInput('prod-dev-semver-autoapprove')
      )
      const label = core.getInput('label')
      const octokit = github.getOctokit(core.getInput('github-token'))

      // get PR context
      // TODO: Don't cast
      const prNumber = github.context.payload.pull_request?.number as number
      const {owner, repo} = github.context.repo

      const {data: pullRequest} = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      })

      // Check if the PR was created by Dependabot
      const isDependabotPR = pullRequest.user?.login === 'dependabot[bot]'
      const shouldAutoMerge = (() => {
        switch (dependencyType) {
          case 'production':
            return prodDepSemverAutoapprove.includes(semverLevel)
          case 'development':
            return devDepSemverAutoapprove.includes(semverLevel)
          default:
            throw new Error(`Unknown dependency type: ${dependencyType}`)
        }
      })()

      // Enable automatic merge on the PR using the specified merge strategy
      await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: mergeStrategy,
        auto_merge: true
      })

      if (isDependabotPR && shouldAutoMerge) {
        await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          event: 'APPROVE'
        })
      } else if (label) {
        // TODO ensure label exists in repository before creating it
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: prNumber,
          labels: [label]
        })
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

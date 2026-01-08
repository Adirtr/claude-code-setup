import fs from 'fs-extra';
import path from 'path';
import type { TestResult, TestReport } from '../types.js';

export async function generateReport(results: TestResult[]): Promise<void> {
  const reportDir = 'test-reports';
  await fs.ensureDir(reportDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `test-report-${timestamp}.md`);

  let report = `# Claude Setup CLI - Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${results.length} |\n`;
  report += `| Passed | ${passed} ✅ |\n`;
  report += `| Failed | ${failed} ${failed > 0 ? '❌' : ''} |\n`;
  report += `| Pass Rate | ${((passed / results.length) * 100).toFixed(1)}% |\n\n`;

  // Quality Metrics
  if (results.some(r => r.quality)) {
    const resultsWithQuality = results.filter(r => r.quality);
    const avgAgentQuality = resultsWithQuality.reduce((sum, r) => {
      const agents = r.quality?.agents || [];
      const agentAvg = agents.length > 0
        ? agents.reduce((s, a) => s + a.finalScore, 0) / agents.length
        : 0;
      return sum + agentAvg;
    }, 0) / resultsWithQuality.length;

    const avgCommandQuality = resultsWithQuality.reduce((sum, r) => {
      const commands = r.quality?.commands || [];
      const commandAvg = commands.length > 0
        ? commands.reduce((s, c) => s + c.finalScore, 0) / commands.length
        : 0;
      return sum + commandAvg;
    }, 0) / resultsWithQuality.length;

    report += `## Quality Metrics\n\n`;
    report += `| Metric | Score |\n`;
    report += `|--------|-------|\n`;
    report += `| Agent Quality | ${avgAgentQuality.toFixed(0)}/100 |\n`;
    report += `| Command Quality | ${avgCommandQuality.toFixed(0)}/100 |\n\n`;
  }

  // Detailed Results
  report += `## Detailed Results\n\n`;

  for (const result of results) {
    report += `### ${result.scenario} ${result.passed ? '✅' : '❌'}\n\n`;
    report += `- Files Generated: ${result.filesGenerated.length}\n`;

    if (result.errors.length > 0) {
      report += `\n**Errors:**\n`;
      result.errors.forEach(e => report += `- ${e}\n`);
      report += `\n`;
    }

    if (result.quality) {
      report += `\n**Quality Assessment:**\n`;

      if (result.quality.agents.length > 0) {
        report += `\nAgents:\n`;
        result.quality.agents.forEach(a => {
          report += `- ${a.name}: ${a.finalScore.toFixed(0)}/100 ${a.isProductionReady ? '✅' : '❌'}\n`;
          if (a.issues.filter(i => i.severity === 'critical').length > 0) {
            report += `  - CRITICAL issues: ${a.issues.filter(i => i.severity === 'critical').length}\n`;
          }
        });
      }

      if (result.quality.commands.length > 0) {
        report += `\nCommands:\n`;
        result.quality.commands.forEach(c => {
          report += `- ${c.name}: ${c.finalScore.toFixed(0)}/100 ${c.isProductionReady ? '✅' : '❌'}\n`;
        });
      }

      report += `\nOverall: ${result.quality.overall.score.toFixed(0)}/100 ${result.quality.overall.passed ? '✅' : '❌'}\n`;
    }

    report += `\n---\n\n`;
  }

  await fs.writeFile(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  // Also print to console
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nPassed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (results.some(r => r.quality)) {
    const resultsWithQuality = results.filter(r => r.quality);
    const avgOverallQuality = resultsWithQuality.reduce((sum, r) =>
      sum + (r.quality?.overall.score || 0), 0) / resultsWithQuality.length;

    console.log(`\nAverage Overall Quality: ${avgOverallQuality.toFixed(0)}/100`);
  }

  // Save JSON report too
  const jsonReport: TestReport = {
    timestamp: new Date().toISOString(),
    scenarios: results,
    summary: {
      total: results.length,
      passed,
      failed,
      averageQuality: results.some(r => r.quality)
        ? results.filter(r => r.quality).reduce((sum, r) => sum + (r.quality?.overall.score || 0), 0) / results.filter(r => r.quality).length
        : 0,
    },
  };

  const jsonPath = path.join(reportDir, `test-report-${timestamp}.json`);
  await fs.writeJson(jsonPath, jsonReport, { spaces: 2 });
  console.log(`JSON report saved to: ${jsonPath}\n`);
}

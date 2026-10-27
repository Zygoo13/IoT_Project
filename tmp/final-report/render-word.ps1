param([Parameter(Mandatory=$true)][string]$InputDocx,[Parameter(Mandatory=$true)][string]$OutputPdf,[switch]$UpdateFields)
$ErrorActionPreference='Stop'
$renderApp=$null
$renderDocument=$null
try {
    $renderApp=New-Object -ComObject Word.Application
    $renderApp.Visible=$false
    $renderApp.DisplayAlerts=0
    $renderDocument=$renderApp.Documents.Open($InputDocx,$false,(-not $UpdateFields.IsPresent),$false)
    if ($UpdateFields) {
        $renderDocument.Fields.Update() | Out-Null
        foreach ($toc in $renderDocument.TablesOfContents) { $toc.Update() }
        $renderDocument.Repaginate()
        $renderDocument.Save()
    }
    $renderDocument.ExportAsFixedFormat($OutputPdf,17)
    Write-Output ('Rendered pages: '+$renderDocument.ComputeStatistics(2))
} finally {
    if ($renderDocument) { $renderDocument.Close(0); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($renderDocument) | Out-Null }
    if ($renderApp) { $renderApp.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($renderApp) | Out-Null }
}

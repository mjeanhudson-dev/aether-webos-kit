# ==============================================================================
# LABEL:               DNS Cutover Watcher (eloquentwin.com)
# USE:                 Decide whether it is safe to move registrar nameservers to Cloudflare and confirm the site is live afterwards.
# MECHANISM_OF_ACTION: Read-only. Resolve-DnsName queries DS, NS, MX and TXT; Invoke-WebRequest compares eloquentwin.com to the Pages origin. Prints WAIT / SAFE TO SWITCH NS / LIVE ON CLOUDFLARE. Exit 0 only when live. -Watch repeats every -IntervalSeconds.
# ==============================================================================
param([switch]$Watch, [int]$IntervalSeconds = 900)

$ErrorActionPreference = 'Stop'
$cfNs = @('brodie.ns.cloudflare.com', 'holly.ns.cloudflare.com')

function Get-State {
    $ds = @(Resolve-DnsName eloquentwin.com -Type DS -ErrorAction SilentlyContinue | Where-Object { $_.Type -eq 'DS' })
    $ns = @(Resolve-DnsName eloquentwin.com -Type NS -ErrorAction SilentlyContinue | Where-Object { $_.Type -eq 'NS' } | ForEach-Object { $_.NameHost.ToLower() })
    $mx = @(Resolve-DnsName eloquentwin.com -Type MX -ErrorAction SilentlyContinue | Where-Object { $_.Type -eq 'MX' } | ForEach-Object { $_.NameExchange.ToLower() })
    $spf = @(Resolve-DnsName eloquentwin.com -Type TXT -ErrorAction SilentlyContinue | Where-Object { $_.Type -eq 'TXT' } | ForEach-Object { $_.Strings -join '' } | Where-Object { $_ -like 'v=spf1*' })
    $onCf = (@($ns | Where-Object { $cfNs -contains $_ })).Count -eq $cfNs.Count
    $emailOk = ($mx -contains 'smtp.google.com') -and ($spf -match 'include:_spf.google.com').Count -gt 0

    if ($onCf) {
        try {
            $h = @{ 'User-Agent' = 'Mozilla/5.0' }
            $a = Invoke-WebRequest 'https://eloquentwin.com/' -Headers $h -UseBasicParsing -TimeoutSec 15
            $b = Invoke-WebRequest 'https://aether-webos-kit.pages.dev/' -Headers $h -UseBasicParsing -TimeoutSec 15
            $same = ($a.StatusCode -eq 200) -and ($a.RawContentLength -eq $b.RawContentLength) -and ($a.Headers['X-Content-Type-Options'] -eq 'nosniff')
        } catch { $same = $false }
        if ($same -and $emailOk) { return @{ Code = 0; Msg = 'LIVE ON CLOUDFLARE: NS, MX, SPF and site match the Pages origin. Next: none.' } }
        if (-not $emailOk) { return @{ Code = 1; Msg = 'WAIT: on Cloudflare NS but MX or SPF missing. Next: restore MX smtp.google.com and the Google SPF TXT in Cloudflare.' } }
        return @{ Code = 1; Msg = 'WAIT: on Cloudflare NS but eloquentwin.com does not match the Pages origin yet. Next: wait for propagation or check Pages custom domain.' }
    }
    if ($ds.Count -gt 0) { return @{ Code = 1; Msg = "WAIT: DS still active (KeyTag $($ds[0].KeyTag)). Next: disable DNSSEC at the registrar." } }
    return @{ Code = 1; Msg = 'SAFE TO SWITCH NS: DS is clear. Next: set registrar nameservers to brodie.ns.cloudflare.com and holly.ns.cloudflare.com.' }
}

do {
    $s = Get-State
    Write-Host "[$(Get-Date -Format o)] $($s.Msg)"
    if (-not $Watch -or $s.Code -eq 0) { exit $s.Code }
    Start-Sleep -Seconds $IntervalSeconds
} while ($true)

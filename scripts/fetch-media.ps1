# Downloads Kenneth's existing portfolio images from his Squarespace CDN
# into public/media/<project>/NN.jpg so the new site can use them locally.
# Re-run any time:  powershell -File scripts/fetch-media.ps1

$base = "https://images.squarespace-cdn.com/content/v1/542e027ae4b078ffd346f19a"
$root = Join-Path $PSScriptRoot "..\public\media"

# slug = folder name; each entry downloads in order as 01.jpg, 02.jpg, ...
$media = [ordered]@{
  "att-discovery-district" = @(
    "d054bdb7-ec44-47ab-b97e-e23cdc823f1f/BLANCO_STILL+%281%29.jpg",
    "1697058712420-D5L1NO08KV6NLIIS12FW/JELLY_G_0.jpg",
    "1697058711601-7S4CNM6OYP9PR7I1E0QS/JELLY_D_3.jpg",
    "1697058709962-ZDRPZANF8ESHBIPGEYBG/B_2.jpg",
    "1697059448425-VCZHPB3XTM5RP6KJNDYH/BLANCO_BTS_STYLEFRAME_24.jpg"
  )
  "bbc-two" = @(
    "1605586151933-H2AQUDSNSO3YWW57E3VH/bbctwo_kr.jpg"
  )
  "cybrpnk" = @(
    "d34a1611-bf66-4dc3-ab94-2510f3625d65/CYPERPUNK_16_b.jpg",
    "1697131040571-PNST7HMKXBY5O3Q66TGB/CYPERPUNK_12_3.jpg",
    "1697131151886-VIC54TE9SB5P77TQ63KI/CYPERPUNK_8_9.jpg",
    "1697131281050-41TZPUL92BI9DGB1DJUC/CYPERPUNK_14_2.jpg",
    "103d2cc2-142b-4b8c-82dd-5675ea623b20/CYPERPUNK_13_4_0048_2.jpg"
  )
  "bmw" = @(
    "1518901634995-KIQMAW8OC04JD7XFEB27/BMW_ROOM3_1_0118.jpg",
    "1518901635975-Q53SIJDWQWGVW0WB4FRM/BMW_ROOM5_1_0118.jpg",
    "1518901636606-I4LQNC5T99R52U1PMY5D/BMW_ROOM5_2_0118.jpg",
    "1518901598906-6FQ89CGQOKDZ1TARPBCG/BMW_ROOM8_14_PASS2_B_2_0119c+copy_preview.jpeg"
  )
  "falling-waters" = @(
    "1605683022377-FF4PI6GHRB63A0YLQ5H2/WATERS_NYC_0_0278.jpg",
    "1605684146349-ZVWYPFXI5U1THJYQLJ99/WATERS_NYC_1_0061+copy.jpg",
    "1605684165698-4KMNTQKKF6MJJ17BJHKM/WATERS_NYC_2B_1_0278+copy.jpg",
    "1605684174503-KI9IYVPAUS4UNWZFPL7Y/WATERS_NYC_5_2_0201+copy.jpg",
    "1605684334194-ERA6FL1337Y8BNXGOCGW/WATERS_NYC_1B+copy.jpg"
  )
  "faraday" = @(
    "1454968590615-MDZYJ562VP7N24SARHH3/CES_KR_EXPLODED_1+copy.jpg",
    "1454968585237-BPYZIKYYJ5P7GZABBQXW/CES_KR_DATACAR_NOGI_3+copy.jpg",
    "1454968574784-BMMVKU2D6CYTDUZ98EKN/CES_KR_BATTERYREVEAL_1C__1+copy.jpg",
    "1454968984565-VP5ASQ5TMFAAY6G0SQSB/CES_KR_ABSTRACTENERGYFLOW_1__1.jpg"
  )
  "spotify-yim" = @(
    "1454970334249-CMVJCHCJL13OVIHYJWR7/YIM_KR_KLAMAR_1.jpg",
    "1454970153754-M0JODTX0I1GHQSJTKSE1/2_YIM_KR_FKATWIGS_1.jpg",
    "1454970141602-U1YKT7TEI80VLKPLVA64/1_TIM_LEONBRIDGES_1.jpg",
    "1454970229019-3GXWGJZUYU3HA999QUOE/YIM_KR_MILEYCYRUS_1c.jpg"
  )
  "xbox-what-if" = @(
    "1412875714686-JN8N6L7FZ4K4W31WW9V8/xbx_knt_albumart_02-copy_o_905_2x.jpg",
    "1412875714692-XGEH9FE61XMX60UPYAUB/xbx_knt_albumart_03-copy_o_905_2x.jpg",
    "1412919229894-H7A6ADLZBB08QD138TQL/xbx_knt_cutaway_O_1+copy.jpg",
    "1412921681556-OGBSF693FHSWACWLN1PG/xbx_knt_cutaway_L_1+copy.jpg"
  )
  "air-jordan-xxxi" = @(
    "1518297217958-IF2AOALNNWKCOL62PQ92/030217_AJXXXI_RENDERS-1.jpg",
    "1518374842439-3XXMSR6W95I0OOPP7KKP/030217_AJXXXI_RENDERS-3.jpg"
  )
  "squarespace" = @(
    "1445489187925-T8VBVICEJ280ZG6TEEWC/SQSP_KR_1.jpg"
  )
}

foreach ($slug in $media.Keys) {
  $dir = Join-Path $root $slug
  New-Item -ItemType Directory -Force $dir | Out-Null
  $i = 1
  foreach ($path in $media[$slug]) {
    $n = "{0:d2}.jpg" -f $i
    $out = Join-Path $dir $n
    if (-not (Test-Path $out)) {
      # format=1500w asks the CDN for a 1500px-wide rendition (big enough for full-bleed)
      curl.exe -sL "$base/$path`?format=1500w" -o $out
    }
    Write-Output "$slug/$n  $((Get-Item $out).Length / 1KB -as [int]) KB"
    $i++
  }
}

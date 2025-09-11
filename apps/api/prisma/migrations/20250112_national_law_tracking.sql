-- 日本全法令スナップショットテーブル
CREATE TABLE IF NOT EXISTS national_law_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id VARCHAR(50) NOT NULL,
  law_name TEXT NOT NULL,
  law_number TEXT,
  promulgation_date DATE,
  last_revision_date DATE,
  metadata_hash VARCHAR(64) NOT NULL,
  content_hash VARCHAR(64),
  full_content TEXT, -- 圧縮された法令本文
  category VARCHAR(100),
  status VARCHAR(50),
  captured_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- インデックス
  UNIQUE(law_id, captured_at),
  INDEX idx_law_id (law_id),
  INDEX idx_metadata_hash (metadata_hash),
  INDEX idx_captured_at (captured_at),
  INDEX idx_category (category)
);

-- 法令変更検知テーブル
CREATE TABLE IF NOT EXISTS law_change_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id VARCHAR(50) NOT NULL,
  law_name TEXT NOT NULL,
  change_type VARCHAR(20) NOT NULL, -- NEW, REVISED, ABOLISHED, METADATA_CHANGED
  previous_snapshot_id UUID REFERENCES national_law_snapshots(id),
  current_snapshot_id UUID REFERENCES national_law_snapshots(id),
  change_details JSONB, -- 変更内容の詳細
  detected_at TIMESTAMP NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_law_id (law_id),
  INDEX idx_change_type (change_type),
  INDEX idx_detected_at (detected_at),
  INDEX idx_notified (notified)
);

-- 日次スキャン履歴テーブル
CREATE TABLE IF NOT EXISTS daily_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id VARCHAR(100) UNIQUE NOT NULL,
  scan_type VARCHAR(20) NOT NULL, -- FULL, INCREMENTAL, CATEGORY
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  total_laws_scanned INTEGER DEFAULT 0,
  new_laws_count INTEGER DEFAULT 0,
  revised_laws_count INTEGER DEFAULT 0,
  abolished_laws_count INTEGER DEFAULT 0,
  metadata_changes_count INTEGER DEFAULT 0,
  errors JSONB,
  status VARCHAR(20) DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_scan_type (scan_type),
  INDEX idx_status (status),
  INDEX idx_completed_at (completed_at)
);

-- 法令カテゴリマスタ（頻繁に更新される法令を優先的にチェック）
CREATE TABLE IF NOT EXISTS law_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) UNIQUE NOT NULL,
  priority INTEGER DEFAULT 100, -- 低い値ほど高優先度
  check_frequency VARCHAR(20) DEFAULT 'DAILY', -- REALTIME, HOURLY, DAILY
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 初期カテゴリデータ
INSERT INTO law_categories (category_name, priority, check_frequency) VALUES
  ('労働基準法', 1, 'HOURLY'),
  ('建築基準法', 2, 'HOURLY'),
  ('個人情報保護法', 3, 'HOURLY'),
  ('消費者契約法', 5, 'DAILY'),
  ('環境基本法', 10, 'DAILY'),
  ('税法', 1, 'HOURLY'),
  ('社会保険', 2, 'HOURLY'),
  ('医療・薬事', 5, 'DAILY'),
  ('金融・証券', 3, 'HOURLY'),
  ('知的財産', 10, 'DAILY')
ON CONFLICT (category_name) DO NOTHING;

-- パフォーマンス用のマテリアライズドビュー
CREATE MATERIALIZED VIEW IF NOT EXISTS law_change_summary AS
SELECT 
  DATE(detected_at) as change_date,
  change_type,
  COUNT(*) as change_count,
  array_agg(DISTINCT category) as affected_categories
FROM law_change_detections lcd
JOIN national_law_snapshots nls ON lcd.current_snapshot_id = nls.id
WHERE detected_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(detected_at), change_type
ORDER BY change_date DESC;

-- インデックスの追加
CREATE INDEX idx_law_change_summary_date ON law_change_summary(change_date);

-- ビューの定期更新（1時間ごと）
CREATE OR REPLACE FUNCTION refresh_law_change_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY law_change_summary;
END;
$$ LANGUAGE plpgsql;
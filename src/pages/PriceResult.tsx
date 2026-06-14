// ============================================================
// pages/PriceResult.tsx - 估价结果页面
// ============================================================
import React, { useState, useEffect } from 'react';
import { Device, ConditionForm, PriceResult as PriceResultType } from '../types';
import { calculatePrice, formatDiscount } from '../utils/pricing';
import { getPriceAlerts, addPriceAlert, updatePriceAlert, deletePriceAlert } from '../utils/storage';

interface Props {
  device: Device;
  condition: ConditionForm;
  onConfirm: () => void;
  onBack: () => void;
}

const PriceResultPage: React.FC<Props> = ({ device, condition, onConfirm, onBack }) => {
  const result: PriceResultType = calculatePrice(device.basePrice, condition);

  const [expectedPrice, setExpectedPrice] = useState<string>(String(result.finalPriceHigh));
  const [alertEnabled, setAlertEnabled] = useState<boolean>(false);
  const [existingAlertId, setExistingAlertId] = useState<string | null>(null);
  const [saveTip, setSaveTip] = useState<string>('');

  useEffect(() => {
    const alerts = getPriceAlerts();
    const existing = alerts.find(
      (a) => a.device.id === device.id &&
        a.condition.screen === condition.screen &&
        a.condition.shell === condition.shell &&
        a.condition.battery === condition.battery &&
        a.condition.function === condition.function
    );
    if (existing) {
      setExistingAlertId(existing.id);
      setExpectedPrice(String(existing.expectedPrice));
      setAlertEnabled(existing.enabled);
    }
  }, [device.id, condition]);

  const rows: { label: string; value: string; discount: string }[] = [
    { label: '基准回收价', value: `¥${result.basePrice}`, discount: '' },
    { label: '屏幕状况', value: condition.screen || '', discount: formatDiscount(result.screenDiscount) },
    { label: '外壳状况', value: condition.shell || '', discount: formatDiscount(result.shellDiscount) },
    { label: '电池健康度', value: condition.battery || '', discount: formatDiscount(result.batteryDiscount) },
    { label: '功能状态', value: condition.function || '', discount: formatDiscount(result.functionDiscount) },
  ];

  const handleToggleAlert = (checked: boolean): void => {
    setAlertEnabled(checked);
    setSaveTip('');
  };

  const handleExpectedPriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setExpectedPrice(val);
    setSaveTip('');
  };

  const handleSaveAlert = (): void => {
    const price = parseInt(expectedPrice, 10);
    if (!price || price <= 0) {
      setSaveTip('请输入有效的期望回收价');
      return;
    }

    if (existingAlertId) {
      updatePriceAlert(existingAlertId, {
        expectedPrice: price,
        enabled: alertEnabled,
        triggered: alertEnabled && result.finalPriceHigh >= price,
        currentPriceLow: result.finalPriceLow,
        currentPriceHigh: result.finalPriceHigh,
      });
      setSaveTip('提醒已更新');
    } else {
      const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      addPriceAlert({
        id,
        device,
        condition,
        expectedPrice: price,
        currentPriceLow: result.finalPriceLow,
        currentPriceHigh: result.finalPriceHigh,
        enabled: alertEnabled,
        triggered: alertEnabled && result.finalPriceHigh >= price,
        createdAt: new Date().toISOString(),
      });
      setExistingAlertId(id);
      setSaveTip(alertEnabled ? '提醒已开启，达到条件后将在首页提示' : '提醒已保存');
    }

    setTimeout(() => setSaveTip(''), 3000);
  };

  const handleDeleteAlert = (): void => {
    if (existingAlertId) {
      deletePriceAlert(existingAlertId);
      setExistingAlertId(null);
      setAlertEnabled(false);
      setSaveTip('提醒已删除');
      setTimeout(() => setSaveTip(''), 3000);
    }
  };

  const isTriggered = alertEnabled && result.finalPriceHigh >= (parseInt(expectedPrice, 10) || 0);

  return (
    <div className="fade-in">
      <div className="section-title">估价结果</div>

      <div className="price-card">
        <div className="price-label">预估回收价</div>
        <div className="price-range">
          ¥{result.finalPriceLow} <span>~</span> ¥{result.finalPriceHigh}
        </div>
        <div className="price-basis">{device.brand} {device.model}</div>
      </div>

      <div className="detail-section">
        <h3>估价明细</h3>
        {rows.map((row, i) => (
          <div key={i} className="detail-row">
            <span className="detail-key">{row.label}</span>
            <span className="detail-val">
              {row.value}
              {row.discount && <span style={{ color: '#ff6b6b', marginLeft: 8 }}>{row.discount}</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h3>价格提醒</h3>
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: '#333' }}>开启价格提醒</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => handleToggleAlert(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
              期望回收价（元）
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={expectedPrice}
              onChange={handleExpectedPriceChange}
              placeholder="请输入期望回收价"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d8cf0'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              当前估价上限：¥{result.finalPriceHigh}
              {isTriggered && (
                <span style={{ color: '#ff6b6b', marginLeft: 8 }}>
                  ✓ 已达到期望价
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn-secondary"
              onClick={handleSaveAlert}
              style={{ flex: 1 }}
            >
              {existingAlertId ? '更新提醒' : '保存提醒'}
            </button>
            {existingAlertId && (
              <button
                className="btn-secondary"
                onClick={handleDeleteAlert}
                style={{ flex: 1, color: '#ff6b6b', borderColor: '#ff6b6b' }}
              >
                删除提醒
              </button>
            )}
          </div>

          {saveTip && (
            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              backgroundColor: '#f0f9eb',
              color: '#67c23a',
              borderRadius: 6,
              fontSize: 13,
              textAlign: 'center',
            }}>
              {saveTip}
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h3>估价说明</h3>
        <ul style={{ fontSize: 13, color: '#666', lineHeight: 2, paddingLeft: 20 }}>
          <li>以上价格为预估范围，实际价格以线下检测为准</li>
          <li>成色越好，回收价格越高</li>
          <li>最终打款金额可能与估价存在差异</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn-secondary" onClick={onBack} style={{ flex: 1 }}>
          重新评估
        </button>
        <button className="btn-primary" onClick={onConfirm} style={{ flex: 2 }}>
          确认估价，提交回收单
        </button>
      </div>
    </div>
  );
};

export default PriceResultPage;

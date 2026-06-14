// ============================================================
// pages/Home.tsx - 首页：热门机型回收价格排行 + 提醒列表
// ============================================================
import React, { useState, useEffect } from 'react';
import { devices } from '../data/devices';
import { PriceAlert } from '../types';
import { checkAndUpdateAlerts, updatePriceAlert, deletePriceAlert, getPriceAlerts } from '../utils/storage';

interface Props {
  onSelectDevice: (deviceId: string) => void;
  onGoSelect: () => void;
  onGoEstimateForAlert: (deviceId: string) => void;
}

const Home: React.FC<Props> = ({ onSelectDevice, onGoSelect, onGoEstimateForAlert }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    setAlerts(checkAndUpdateAlerts());
  }, []);

  const refreshAlerts = (): void => {
    setAlerts(getPriceAlerts());
  };

  const hotDevices = [...devices]
    .sort((a, b) => b.basePrice - a.basePrice)
    .slice(0, 10);

  const triggeredAlerts = alerts.filter((a) => a.enabled && a.triggered);

  const getRankClass = (index: number): string => {
    if (index === 0) return 'hot-rank hot-rank-1';
    if (index === 1) return 'hot-rank hot-rank-2';
    if (index === 2) return 'hot-rank hot-rank-3';
    return 'hot-rank hot-rank-n';
  };

  const getBadgeInfo = (alert: PriceAlert): { className: string; text: string } => {
    if (alert.enabled && alert.triggered) {
      return { className: 'alert-badge badge-triggered', text: '✓ 已达期望价' };
    }
    if (alert.enabled) {
      return { className: 'alert-badge badge-watching', text: '🔔 监控中' };
    }
    return { className: 'alert-badge badge-disabled', text: '已关闭' };
  };

  const formatCondition = (alert: PriceAlert): string => {
    const parts: string[] = [];
    if (alert.condition.screen) parts.push(alert.condition.screen);
    if (alert.condition.shell) parts.push(alert.condition.shell);
    if (alert.condition.battery) parts.push(alert.condition.battery);
    if (alert.condition.function) parts.push(alert.condition.function);
    return parts.length > 0 ? parts.join(' · ') : '成色未设置';
  };

  const handleToggleAlert = (alertId: string, enabled: boolean): void => {
    updatePriceAlert(alertId, {
      enabled,
      triggered: enabled && alerts.find((a) => a.id === alertId)!.currentPriceHigh >=
        alerts.find((a) => a.id === alertId)!.expectedPrice,
    });
    refreshAlerts();
  };

  const handleDeleteAlert = (alertId: string): void => {
    deletePriceAlert(alertId);
    refreshAlerts();
  };

  const handleGoEstimate = (alert: PriceAlert): void => {
    onGoEstimateForAlert(alert.device.id);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>数码回收估价</h2>
        <p style={{ fontSize: 14, color: '#999' }}>快速评估您的二手数码设备价值</p>
      </div>

      <button className="btn-primary" style={{ marginBottom: 28 }} onClick={onGoSelect}>
        开始估价
      </button>

      {/* 醒目提醒通知 */}
      {triggeredAlerts.length > 0 && (
        <div className="alert-notice pulse">
          <span className="alert-icon">🔔</span>
          <div className="alert-text">
            <strong>{triggeredAlerts.length} 个设备已达到期望回收价</strong>
            <span>点击下方提醒可立即前往估价回收</span>
          </div>
        </div>
      )}

      {/* 提醒列表（独立展示） */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>
            <span>🔔</span>
            我的价格提醒
            <span style={{
              marginLeft: 8,
              fontSize: 12,
              color: '#999',
              fontWeight: 400,
            }}>
              （{alerts.length}）
            </span>
          </h2>
          <div className="alert-list">
            {alerts.map((alert) => {
              const badge = getBadgeInfo(alert);
              return (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.enabled && alert.triggered ? 'triggered' : ''}`}
                >
                  <div className="alert-item-header">
                    <div>
                      <div className="alert-device-name">{alert.device.model}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {alert.device.brand} · {alert.device.category}
                      </div>
                    </div>
                    <span className={badge.className}>{badge.text}</span>
                  </div>

                  <div className="alert-price-row">
                    <div>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>期望价</div>
                      <div className="alert-expected">¥{alert.expectedPrice}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>当前估价</div>
                      <div className="alert-current">
                        ¥{alert.currentPriceLow} ~ ¥{alert.currentPriceHigh}
                      </div>
                    </div>
                  </div>

                  <div className="alert-condition">成色：{formatCondition(alert)}</div>

                  <div className="alert-actions">
                    <button
                      className="alert-action-btn primary"
                      onClick={() => handleGoEstimate(alert)}
                    >
                      前往估价
                    </button>
                    <button
                      className="alert-action-btn"
                      style={{
                        background: alert.enabled ? '#e3f2fd' : '#fff3e0',
                        color: alert.enabled ? '#1976d2' : '#ef6c00',
                      }}
                      onClick={() => handleToggleAlert(alert.id, !alert.enabled)}
                    >
                      {alert.enabled ? '关闭提醒' : '开启提醒'}
                    </button>
                    <button
                      className="alert-action-btn danger"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="hot-section">
        <h2>🔥 热门回收价格排行</h2>
        <div className="hot-list">
          {hotDevices.map((device, index) => (
            <div
              key={device.id}
              className="hot-item"
              onClick={() => onSelectDevice(device.id)}
            >
              <div className={getRankClass(index)}>{index + 1}</div>
              <div className="hot-info">
                <div className="hot-name">{device.model}</div>
                <div className="hot-brand">{device.brand} · {device.category}</div>
              </div>
              <div className="hot-price">¥{device.basePrice}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tip-bar">
        <span>💡</span>
        <span>以上为完美成色预估回收价，实际价格取决于设备成色状况。</span>
      </div>
    </div>
  );
};

export default Home;

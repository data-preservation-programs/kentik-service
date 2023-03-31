/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AgentMetadataIpValue {
  value?: string;
}

export interface ProtobufAny {
  typeUrl?: string;
  /** @format byte */
  value?: string;
}

export interface RpcStatus {
  /** @format int32 */
  code?: number;
  message?: string;
  details?: ProtobufAny[];
}

/** Location */
export interface Syntheticsv202202Location {
  /**
   * Latitude in signed decimal degrees
   * @format double
   */
  latitude?: number;
  /**
   * Longitude in signed decimal degrees
   * @format double
   */
  longitude?: number;
  /** Country of the location */
  country?: string;
  /** Geographic region within the country */
  region?: string;
  /** City of the location */
  city?: string;
}

/** ActivationSettings */
export interface V202202ActivationSettings {
  /** Period of healthy status in minutes within the time window not cancelling alarm activation */
  gracePeriod?: string;
  /** Time unit for specifying time window (m | h) */
  timeUnit?: string;
  /** Time window for evaluating of test for alarm activation */
  timeWindow?: string;
  /** Number of occurrences of unhealthy test status within the time window triggering alarm activation */
  times?: string;
}

/** Agent */
export interface V202202Agent {
  /** Unique identifier of the agent */
  id?: string;
  /** Name of the site where agent is located */
  siteName?: string;
  /** Operational status */
  status?: V202202AgentStatus;
  /** User selected descriptive name of the agent */
  alias?: string;
  /** Type of agent (global | private) */
  type?: string;
  /** OS version of server/VM hosting the agent */
  os?: string;
  /** Public IP address of the agent (auto-detected) */
  ip?: string;
  /**
   * Latitude of agent's location (signed decimal degrees)
   * @format double
   */
  lat?: number;
  /**
   * Longitude of agent's location (signed decimal degrees)
   * @format double
   */
  long?: number;
  /**
   * Timestamp of the last authorization
   * @format date-time
   */
  lastAuthed?: string;
  /** IP address family supported by the agent */
  family?: V202202IPFamily;
  /**
   * ASN of the AS owning agent's public address
   * @format int64
   */
  asn?: number;
  /** ID of the site hosting the agent (if configured in Kentik) */
  siteId?: string;
  /** Software version of the agent */
  version?: string;
  /** City where the agent is located */
  city?: string;
  /** Geographical region of agent's location */
  region?: string;
  /** Country of agent's location */
  country?: string;
  /** IDs of user's test running on the agent */
  testIds?: string[];
  /** Internal IP address of the agent */
  localIp?: string;
  /** Cloud region (if any) hosting the agent */
  cloudRegion?: string;
  /** Cloud provider (if any) hosting the agent */
  cloudProvider?: string;
  /**
   * - IMPLEMENT_TYPE_RUST: ksynth, a.k.a network agent (implemented in Rust) capable of running all tasks except for page-load and transaction
   *  - IMPLEMENT_TYPE_NODE: ksynth-agent, a.k.a. app agent (implemented in NodeJS) with Chromium enabled capable of running all tasks
   *  - IMPLEMENT_TYPE_NETWORK: ksynth-agent, a.k.a. app agent with Chromium disabled, capable of running all tasks except for page-load and transaction
   */
  agentImpl?: V202202ImplementType;
  /** List of names of labels associated with the agent */
  labels?: string[];
  /** Additional information about agent's configuration and run-time state */
  metadata?: V202202AgentMetadata;
}

/** AgentMetadata */
export interface V202202AgentMetadata {
  /** List of private IPv4 addresses */
  privateIpv4Addresses?: AgentMetadataIpValue[];
  /** List of public IPv4 addresses */
  publicIpv4Addresses?: AgentMetadataIpValue[];
  /** List of private IPv6 addresses */
  privateIpv6Addresses?: AgentMetadataIpValue[];
  /** List of public IPv6 addresses */
  publicIpv6Addresses?: AgentMetadataIpValue[];
}

/** AgentResults */
export interface V202202AgentResults {
  /** ID of the agent providing results */
  agentId?: string;
  /** Overall health status of all task for the test executed by this agent */
  health?: string;
  /** List of results for individual tasks */
  tasks?: V202202TaskResults[];
}

/**
 * AgentStatus
 * - AGENT_STATUS_UNSPECIFIED: Invalid value.
 *  - AGENT_STATUS_OK: Agent is ready to accept tests
 *  - AGENT_STATUS_WAIT: Agent is waiting for authorization
 *  - AGENT_STATUS_DELETED: Agent was deleted - not user settable
 * @default "AGENT_STATUS_UNSPECIFIED"
 */
export enum V202202AgentStatus {
  AGENT_STATUS_UNSPECIFIED = "AGENT_STATUS_UNSPECIFIED",
  AGENT_STATUS_OK = "AGENT_STATUS_OK",
  AGENT_STATUS_WAIT = "AGENT_STATUS_WAIT",
  AGENT_STATUS_DELETED = "AGENT_STATUS_DELETED",
}

/** AgentTest */
export interface V202202AgentTest {
  /** ID of the target agent */
  target?: string;
  /** Boolean value indicating whether to use local (private) IP address of the target agent */
  useLocalIp?: boolean;
}

/** CreateTestRequest */
export interface V202202CreateTestRequest {
  /** Test configuration data */
  test: V202202Test;
}

/** CreateTestResponse */
export interface V202202CreateTestResponse {
  /** Test configuration and status data */
  test?: V202202Test;
}

/**
 * DNSRecord
 * - DNS_RECORD_UNSPECIFIED: Invalid value
 *  - DNS_RECORD_A: name to IPv4 address(es) mapping
 *  - DNS_RECORD_AAAA: name to IPv6 address(es) mapping
 *  - DNS_RECORD_CNAME: alternative resource name
 *  - DNS_RECORD_DNAME: alternative resource set name
 *  - DNS_RECORD_NS: domain to name server mapping
 *  - DNS_RECORD_MX: SMTP mail server record
 *  - DNS_RECORD_PTR: IPv4/6 address to name mapping
 *  - DNS_RECORD_SOA: domain meta-data
 * @default "DNS_RECORD_UNSPECIFIED"
 */
export enum V202202DNSRecord {
  DNS_RECORD_UNSPECIFIED = "DNS_RECORD_UNSPECIFIED",
  DNS_RECORD_A = "DNS_RECORD_A",
  DNS_RECORD_AAAA = "DNS_RECORD_AAAA",
  DNS_RECORD_CNAME = "DNS_RECORD_CNAME",
  DNS_RECORD_DNAME = "DNS_RECORD_DNAME",
  DNS_RECORD_NS = "DNS_RECORD_NS",
  DNS_RECORD_MX = "DNS_RECORD_MX",
  DNS_RECORD_PTR = "DNS_RECORD_PTR",
  DNS_RECORD_SOA = "DNS_RECORD_SOA",
}

/** DNSResponseData */
export interface V202202DNSResponseData {
  /**
   * Received DNS status
   * @format int64
   */
  status?: number;
  /** Text rendering of received DNS resolution */
  data?: string;
}

/** DNSResults */
export interface V202202DNSResults {
  /** Queried DNS record */
  target?: string;
  /** DNS server used for the query */
  server?: string;
  /** DNS response latency metric and health */
  latency?: V202202MetricData;
  /** Information about received DNS response */
  response?: V202202DNSResponseData;
}

/** DeleteAgentResponse */
export type V202202DeleteAgentResponse = object;

/** DeleteTestResponse */
export type V202202DeleteTestResponse = object;

/** DnsTest */
export interface V202202DnsTest {
  /** Fully qualified DNS name to query */
  target?: string;
  /**
   * --- Deprecated: value is ignored. ---
   * @format int64
   */
  timeout?: number;
  /** Type of DNS record to query */
  recordType?: V202202DNSRecord;
  /** List of IP addresses of DNS servers */
  servers?: string[];
  /**
   * Target DNS server port
   * @format int64
   */
  port?: number;
}

/** FlowTest */
export interface V202202FlowTest {
  /** Target ASN, CDN, Country, Region of City for autonomous test (type of value depends on flow test sub-type) */
  target?: string;
  /**
   * Period (in milliseconds) for refreshing list of targets based on available flow data
   * @format int64
   */
  targetRefreshIntervalMillis?: number;
  /**
   * Maximum number of IP providers to track autonomously
   * @format int64
   */
  maxProviders?: number;
  /**
   * Maximum number of target IP addresses to select based flow data query
   * @format int64
   */
  maxIpTargets?: number;
  /** Autonomous test sub-type (asn | cdn | country | region | city) */
  type?: string;
  /** Selection of address from flow data (src = source address in inbound flows | dst = destination addresses in outbound flows) */
  inetDirection?: string;
  /** Direction of flows to match target attribute for extraction of target addresses (src | dst) */
  direction?: string;
}

/** GetAgentResponse */
export interface V202202GetAgentResponse {
  /** Agent configuration and status data */
  agent?: V202202Agent;
}

/** GetResultsForTestsRequest */
export interface V202202GetResultsForTestsRequest {
  /** List of test IDs for which to retrieve results */
  ids: string[];
  /**
   * Timestamp of the oldest results to include in results
   * @format date-time
   */
  startTime: string;
  /**
   * Timestamp of the newest results to include in results
   * @format date-time
   */
  endTime: string;
  /** List of agent IDs from which to return results */
  agentIds?: string[];
  /** List of targets (test dependent) for which to retrieve results */
  targets?: string[];
  /** If true, retrieve result aggregated across the requested time period, else return complete time series */
  aggregate?: boolean;
}

/** GetResultsForTestsResponse */
export interface V202202GetResultsForTestsResponse {
  results?: V202202TestResults[];
}

/** GetTestResponse */
export interface V202202GetTestResponse {
  /** Test configuration and status data */
  test?: V202202Test;
}

/** GetTraceForTestRequest */
export interface V202202GetTraceForTestRequest {
  /** ID of test for which to retrieve network path trace data */
  id?: string;
  /**
   * Timestamp of the oldest results to include in results
   * @format date-time
   */
  startTime: string;
  /**
   * Timestamp of the newest results to include in results
   * @format date-time
   */
  endTime: string;
  /** List of agent IDs from which to return results */
  agentIds?: string[];
  /** List of target IP addresses for which to retrieve results */
  targetIps?: string[];
}

/** GetTraceForTestResponse */
export interface V202202GetTraceForTestResponse {
  /** Map of network node information keyed by node IDs */
  nodes?: Record<string, V202202NetNode>;
  /** List of retrieved network path data */
  paths?: V202202Path[];
}

/** HTTPResponseData */
export interface V202202HTTPResponseData {
  /**
   * HTTP status in response
   * @format int64
   */
  status?: number;
  /**
   * Total size of  received response body
   * @format int64
   */
  size?: number;
  /** Detailed information about transaction timing, connection characteristics and response */
  data?: string;
}

/** HTTPResults */
export interface V202202HTTPResults {
  /** Target probed URL */
  target?: string;
  /** HTTP response latency metric and health */
  latency?: V202202MetricData;
  /** Information about received HTTP response */
  response?: V202202HTTPResponseData;
  /** IP address of probed target server */
  dstIp?: string;
}

/** HealthSettings */
export interface V202202HealthSettings {
  /**
   * Threshold for ping or DNS response latency (in microseconds) to trigger critical alarm
   * @format float
   */
  latencyCritical?: number;
  /**
   * Threshold for ping or DNS response latency (in microseconds) to trigger warning alarm
   * @format float
   */
  latencyWarning?: number;
  /**
   * Threshold for ping packet loss (in %) to trigger critical alarm
   * @format float
   */
  packetLossCritical?: number;
  /**
   * Threshold for ping packet loss (in %) to trigger warning alarm
   * @format float
   */
  packetLossWarning?: number;
  /**
   * Threshold for ping jitter (in microseconds) to trigger critical alarm
   * @format float
   */
  jitterCritical?: number;
  /**
   * Threshold for ping jitter (in microseconds) to trigger critical alarm
   * @format float
   */
  jitterWarning?: number;
  /**
   * Threshold for HTTP response latency (in microseconds) to trigger critical alarm
   * @format float
   */
  httpLatencyCritical?: number;
  /**
   * Threshold for HTTP response latency (in microseconds) to trigger warning alarm
   * @format float
   */
  httpLatencyWarning?: number;
  /** List of HTTP status codes indicating healthy state */
  httpValidCodes?: number[];
  /** List of DNS status codes indicating healthy state */
  dnsValidCodes?: number[];
  /**
   * Threshold for standard deviation (in microseconds) of ping or DNS response latency to trigger critical alarm
   * @format float
   */
  latencyCriticalStddev?: number;
  /**
   * Threshold for standard deviation (in microseconds) of ping or DNS response latency to trigger warning alarm
   * @format float
   */
  latencyWarningStddev?: number;
  /**
   * Threshold for standard deviation of ping jitter (in microseconds) to trigger critical alarm
   * @format float
   */
  jitterCriticalStddev?: number;
  /**
   * Threshold for standard deviation of ping jitter (in microseconds) to trigger warning alarm
   * @format float
   */
  jitterWarningStddev?: number;
  /**
   * Threshold for standard deviation of HTTP response latency (in microseconds) to trigger critical alarm
   * @format float
   */
  httpLatencyCriticalStddev?: number;
  /**
   * Threshold for standard deviation of HTTP response latency (in microseconds) to trigger warning alarm
   * @format float
   */
  httpLatencyWarningStddev?: number;
  /**
   * Number of tasks (across all agents) that must report unhealthy status in order for alarm to be triggered
   * @format int64
   */
  unhealthySubtestThreshold?: number;
  /** Alarm activation settings */
  activation?: V202202ActivationSettings;
  /**
   * Threshold for remaining validity of TLS certificate (in days) to trigger warning alarm
   * @format int64
   */
  certExpiryWarning?: number;
  /**
   * Threshold for remaining validity of TLS certificate (in days) to trigger critical alarm
   * @format int64
   */
  certExpiryCritical?: number;
  /** Comma separated list of IP addresses expected to be received in response to DNS A or AAAA query */
  dnsValidIps?: string;
}

/** HostnameTest */
export interface V202202HostnameTest {
  /** Fully qualified DNS name of the target host */
  target?: string;
}

/**
 * IPFamily
 * - IP_FAMILY_UNSPECIFIED: Invalid value.
 *  - IP_FAMILY_V4: IPv4 only
 *  - IP_FAMILY_V6: IPv6 only
 *  - IP_FAMILY_DUAL: IPv4 and IPv6 supported
 * @default "IP_FAMILY_UNSPECIFIED"
 */
export enum V202202IPFamily {
  IP_FAMILY_UNSPECIFIED = "IP_FAMILY_UNSPECIFIED",
  IPFAMILYV4 = "IP_FAMILY_V4",
  IPFAMILYV6 = "IP_FAMILY_V6",
  IP_FAMILY_DUAL = "IP_FAMILY_DUAL",
}

/**
 * ImplementType
 * - IMPLEMENT_TYPE_RUST: ksynth, a.k.a network agent (implemented in Rust) capable of running all tasks except for page-load and transaction
 *  - IMPLEMENT_TYPE_NODE: ksynth-agent, a.k.a. app agent (implemented in NodeJS) with Chromium enabled capable of running all tasks
 *  - IMPLEMENT_TYPE_NETWORK: ksynth-agent, a.k.a. app agent with Chromium disabled, capable of running all tasks except for page-load and transaction
 * @default "IMPLEMENT_TYPE_UNSPECIFIED"
 */
export enum V202202ImplementType {
  IMPLEMENT_TYPE_UNSPECIFIED = "IMPLEMENT_TYPE_UNSPECIFIED",
  IMPLEMENT_TYPE_RUST = "IMPLEMENT_TYPE_RUST",
  IMPLEMENT_TYPE_NODE = "IMPLEMENT_TYPE_NODE",
  IMPLEMENT_TYPE_NETWORK = "IMPLEMENT_TYPE_NETWORK",
}

/** IpTest */
export interface V202202IpTest {
  /** List of IP addresses of targets */
  targets?: string[];
}

/** ListAgentsResponse */
export interface V202202ListAgentsResponse {
  /** List of available agents */
  agents?: V202202Agent[];
  /**
   * Number of invalid entries encountered while collecting data
   * @format int64
   */
  invalidCount?: number;
}

/** ListTestsResponse */
export interface V202202ListTestsResponse {
  /** List of configured active or paused tests */
  tests?: V202202Test[];
  /**
   * Number of invalid entries encountered while collecting data
   * @format int64
   */
  invalidCount?: number;
}

/** MetricData */
export interface V202202MetricData {
  /**
   * Current value of metric
   * @format int64
   */
  current?: number;
  /**
   * Rolling average of metric
   * @format int64
   */
  rollingAvg?: number;
  /**
   * Rolling average of standard deviation of metric
   * @format int64
   */
  rollingStddev?: number;
  /** Health evaluation status for the metric (healthy | warning | critical) */
  health?: string;
}

/** NetNode */
export interface V202202NetNode {
  /** IP address of the node in standard textual notation */
  ip?: string;
  /**
   * AS number owning the address of the node
   * @format int64
   */
  asn?: number;
  /** Name of the AS owning the address of the node */
  asName?: string;
  /** Location of IP address of the node */
  location?: Syntheticsv202202Location;
  /** DNS name of the node (obtained by reverse DNS resolution) */
  dnsName?: string;
  /** ID of the device corresponding with the node in Kentik configuration */
  deviceId?: string;
  /** ID of the site containing the device corresponding with the node in Kentik configuration */
  siteId?: string;
}

/** NetworkMeshTest */
export interface V202202NetworkMeshTest {
  /** Boolean value indicating whether to use local (private) IP address of the target agents */
  useLocalIp?: boolean;
}

/** PacketLossData */
export interface V202202PacketLossData {
  /**
   * Current packet loss value
   * @format double
   */
  current?: number;
  /** Health evaluation status for the metric (healthy | warning | critical) */
  health?: string;
}

/** PageLoadTest */
export interface V202202PageLoadTest {
  /** HTTP or HTTPS URL to request */
  target?: string;
  /**
   * HTTP transaction timeout (in milliseconds)
   * @format int64
   */
  timeout?: number;
  /** Map of HTTP header values keyed by header names */
  headers?: Record<string, string>;
  /** Boolean indicating whether to ignore TLS certificate verification errors */
  ignoreTlsErrors?: boolean;
  /** Map of CSS selector values keyed by selector name */
  cssSelectors?: Record<string, string>;
}

/** Path */
export interface V202202Path {
  /** ID of the agent generating the path data */
  agentId?: string;
  /** IP address of the target of the path */
  targetIp?: string;
  /** Hop count statistics across all traces */
  hopCount?: V202202Stats;
  /**
   * Maximum length of AS path across all traces
   * @format int32
   */
  maxAsPathLength?: number;
  /** Data for individual traces */
  traces?: V202202PathTrace[];
  /**
   * Timestamp (UTC) of initiation of the path trace
   * @format date-time
   */
  time?: string;
}

/** PathTrace */
export interface V202202PathTrace {
  /** AS path of the network trace */
  asPath?: number[];
  /** Indication whether response from target was received */
  isComplete?: boolean;
  /** List of hops in the trace */
  hops?: V202202TraceHop[];
}

/** PingResults */
export interface V202202PingResults {
  /** Hostname or address of the probed target */
  target?: string;
  /** Packet loss metric and health */
  packetLoss?: V202202PacketLossData;
  /** Packet latency metric and health */
  latency?: V202202MetricData;
  /** Latency jitter (variance) metric and health */
  jitter?: V202202MetricData;
  /** IP address of probed target */
  dstIp?: string;
}

/** SetTestStatusRequest */
export interface V202202SetTestStatusRequest {
  /** ID of the test which status is to be modified */
  id: string;
  /** Target test status */
  status: V202202TestStatus;
}

/** SetTestStatusResponse */
export type V202202SetTestStatusResponse = object;

/** Stats */
export interface V202202Stats {
  /**
   * Average value
   * @format int32
   */
  average?: number;
  /**
   * Minimum value
   * @format int32
   */
  min?: number;
  /**
   * Maximum value
   * @format int32
   */
  max?: number;
}

/** TaskResults */
export interface V202202TaskResults {
  /** Entry containing ping task results */
  ping?: V202202PingResults;
  /** Entry containing HTTP task results */
  http?: V202202HTTPResults;
  /** Entry containing DNS task results */
  dns?: V202202DNSResults;
  /** Health status of the task */
  health?: string;
}

/** Test */
export interface V202202Test {
  /** Unique ID of the test */
  id?: string;
  /** User selected name of the test */
  name?: string;
  /** Type of the test */
  type?: string;
  /** Operational status of the test */
  status?: V202202TestStatus;
  /** Test configuration */
  settings?: V202202TestSettings;
  /**
   * Creation timestamp (UTC)
   * @format date-time
   */
  cdate?: string;
  /**
   * Last modification timestamp (UTC)
   * @format date-time
   */
  edate?: string;
  /** Identity of test creator */
  createdBy?: V202303UserInfo;
  /** Identity of use that has modified the test last */
  lastUpdatedBy?: V202303UserInfo;
  /** Set of labels associated with the test */
  labels?: string[];
}

/** TestPingSettings */
export interface V202202TestPingSettings {
  /**
   * Number of probe packets to send in one iteration
   * @format int64
   */
  count?: number;
  /** Transport protocol to use (icmp | tcp) */
  protocol?: string;
  /**
   * Target port for TCP probes (ignored for ICMP)
   * @format int64
   */
  port?: number;
  /**
   * Timeout in milliseconds for execution of the task
   * @format int64
   */
  timeout?: number;
  /**
   * Inter-probe delay in milliseconds
   * @format float
   */
  delay?: number;
  /**
   * DSCP code to be set in IP header of probe packets
   * @format int64
   */
  dscp?: number;
}

/** TestResults */
export interface V202202TestResults {
  /** ID of the test for which results are provided */
  testId?: string;
  /**
   * Results timestamp (UTC)
   * @format date-time
   */
  time?: string;
  /** Health status of the test */
  health?: string;
  /** List of results from agents executing tasks on behalf of the test */
  agents?: V202202AgentResults[];
}

/** TestSettings */
export interface V202202TestSettings {
  hostname?: V202202HostnameTest;
  ip?: V202202IpTest;
  agent?: V202202AgentTest;
  flow?: V202202FlowTest;
  dns?: V202202DnsTest;
  url?: V202202UrlTest;
  networkGrid?: V202202IpTest;
  pageLoad?: V202202PageLoadTest;
  dnsGrid?: V202202DnsTest;
  networkMesh?: V202202NetworkMeshTest;
  /** IDs of agents assigned to run tasks on behalf of the test */
  agentIds?: string[];
  /** List of task names to run for the test */
  tasks?: string[];
  /** Health evaluation thresholds, acceptable responses and alarm activation settings */
  healthSettings?: V202202HealthSettings;
  /** Ping tasks configuration parameters */
  ping?: V202202TestPingSettings;
  /** Traceroute task configuration parameters */
  trace?: V202202TestTraceSettings;
  /**
   * Test evaluation period (in seconds)
   * @format int64
   */
  period?: number;
  /** IP address family to select from available DNS name resolutions */
  family?: V202202IPFamily;
  /** List of IDs of notification channels for alarms triggered by the test */
  notificationChannels?: string[];
  /** Add a note or comment for this test */
  notes?: string;
}

/**
 * TestStatus
 * - TEST_STATUS_UNSPECIFIED: Invalid value.
 *  - TEST_STATUS_ACTIVE: Test is active.
 *  - TEST_STATUS_PAUSED: Test is paused.
 *  - TEST_STATUS_DELETED: Test is deleted. Not user settable.
 * @default "TEST_STATUS_UNSPECIFIED"
 */
export enum V202202TestStatus {
  TEST_STATUS_UNSPECIFIED = "TEST_STATUS_UNSPECIFIED",
  TEST_STATUS_ACTIVE = "TEST_STATUS_ACTIVE",
  TEST_STATUS_PAUSED = "TEST_STATUS_PAUSED",
  TEST_STATUS_DELETED = "TEST_STATUS_DELETED",
}

/** TestTraceSettings */
export interface V202202TestTraceSettings {
  /**
   * Number of probe packets to send in one iteration
   * @format int64
   */
  count?: number;
  /** Transport protocol to use (icmp | tcp | udp) */
  protocol?: string;
  /**
   * Target port for TCP or UDP probes (ignored for ICMP)
   * @format int64
   */
  port?: number;
  /**
   * Timeout in milliseconds for execution of the task
   * @format int64
   */
  timeout?: number;
  /**
   * Maximum number of hops to probe (i.e. maximum TTL)
   * @format int64
   */
  limit?: number;
  /**
   * Inter-probe delay in milliseconds
   * @format float
   */
  delay?: number;
  /**
   * DSCP code to be set in IP header of probe packets
   * @format int64
   */
  dscp?: number;
}

/** TraceHop */
export interface V202202TraceHop {
  /**
   * Round-trip packet latency to the node (in microseconds) - 0 if no response was received
   * @format int32
   */
  latency?: number;
  /** ID of the node for this hop in the Nodes map  - empty if no response was received */
  nodeId?: string;
}

/** UpdateAgentRequest */
export interface V202202UpdateAgentRequest {
  /** Agent configuration data */
  agent?: V202202Agent;
}

/** UpdateAgentResponse */
export interface V202202UpdateAgentResponse {
  /** Agent configuration and status data */
  agent?: V202202Agent;
}

/** UpdateTestRequest */
export interface V202202UpdateTestRequest {
  /** Test configuration data */
  test?: V202202Test;
}

/** UpdateTestResponse */
export interface V202202UpdateTestResponse {
  /** Test configuration and status data */
  test?: V202202Test;
}

/** UrlTest */
export interface V202202UrlTest {
  /** HTTP or HTTPS URL to request */
  target?: string;
  /**
   * HTTP transaction timeout (in milliseconds)
   * @format int64
   */
  timeout?: number;
  /** HTTP method to use (GET | HEAD | PATCH | POST | PUT) */
  method?: string;
  /** Map of HTTP header values keyed by header names */
  headers?: Record<string, string>;
  /** HTTP request body */
  body?: string;
  /** Boolean indicating whether to ignore TLS certificate verification errors */
  ignoreTlsErrors?: boolean;
}

/** UserInfo */
export interface V202303UserInfo {
  /** Unique system generated ID */
  id?: string;
  /** E-mail address of the user */
  email?: string;
  /** Full name of the user */
  fullName?: string;
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "https://grpc.api.kentik.com" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Synthetics Monitoring API
 * @version v202202
 * @baseUrl https://grpc.api.kentik.com
 * @externalDocs https://kb.kentik.com/v4/Ma00.htm#Ma00-Synthetics_Overview
 * @contact Kentik API Engineering (https://github.com/kentik/api-schema-public)
 *
 * # Overview
 * The Synthetics Monitoring API provides programmatic access to Kentik's [synthetic monitoring system](https://kb.kentik.com/v4/Ma00.htm). The API consists of two endpoints:
 * | Endpoint | Purpose |
 * |-----------|---------|
 * | SyntheticsAdminService | CRUD operations for synthetic tests and agents |
 * | SyntheticsDataService  | Retrieval of synthetic test results and network traces |
 *
 * Both REST endpoint and gRPC RPCs are provided.
 * ### Known Limitations
 * The API currently does not support the following [Synthetic Test Types](https://kb.kentik.com/v4/Ma00.htm#Ma00-Synthetic_Test_Types):
 * * BGP Monitor tests, which are supported in a [separate API](https://github.com/kentik/api-schema-public/blob/master/proto/kentik/bgp_monitoring/v202205beta1/bgp_monitoring.proto)
 * * Transaction tests.
 *
 * ### Additional Public Resources
 * Kentik community [Python](https://github.com/kentik/community_sdk_python) and [Go](https://github.com/kentik/community_sdk_golang) SDKs provide language-specific support for using this and other Kentik APIs. These SDKs can be also used as example code for development.
 *  A [Terraform provider](https://registry.terraform.io/providers/kentik/kentik-synthetics) is available for configuring tests and agents for Kentik synthetic monitoring.
 * # Anatomy of a Synthetic Test
 * Each `Test` consists of one or more tasks. Tasks are executed by monitoring `Agents` that send synthetic traffic (probes) over the network. The API currently supports following tasks:
 * | Task name  | Purpose |
 * |------------|---------|
 * | ping       | Test basic address, and optionally TCP port reachability |
 * | traceroute (a.k.a. trace)| Discover unidirectional network path |
 * | http | Perform a simple HTTP/HTTPS request |
 * | page-load | Use headless Chromium to execute an HTTP/HTTPS request |
 * | dns | Execute a DNS query|
 *
 * The set of tasks executed on behalf of a given test depends on the `type` of that test. The following test types are currently supported by the API:
 * | API type | Portal (UI) equivalent | Tasks |
 * |---------------|--------------|-------|
 * | ip | IP Address | ping, traceroute |
 * | hostname | Hostname | ping, traceroute |
 * | network_grid | Network Grid | ping, traceroute |
 * | agent | Agent-to-Agent | ping, traceroute |
 * | network_mesh | Network Mesh | ping, traceroute |
 * | flow | Autonomous Tests (5 variants) | ping, traceroute |
 * | url | HTTP(S) or API | http, ping (optional), traceroute (optional) |
 * | page_load | Page Load | page-load, ping (optional), traceroute (optional) |
 * | dns | DNS Server Monitor | dns |
 * | dns_grid | DNS Server Grid | dns |
 *
 * ***Note:*** `ping` and `traceroute` tasks are always run together (never one without the other).
 *
 * # Test Attributes and Settings
 * The attributes of the test object enable configuration of test settings, access to test metadata, and access to runtime state information.
 * ### State and Metadata Attributes
 *  The following table lists the metadata and state attributes:
 * | Attribute | Access | Purpose |
 * |-----------|--------|---------|
 * | id | RO | System-generated unique identifier of the test |
 * | name | RW | User specified name for the test (need not be unique) |
 * | type | RO (after creation) | Type of the test (set on creation; read-only thereafter) |
 * | status | RW | Life-cycle status of the test |
 * | cdate | RO | Creation timestamp |
 * | edate | RO | Last-modification timestamp |
 * | created_by | RO | Identity of the user that created the test |
 * | last_updated_by | RO | Identity of the latest user to modify the test |
 * | labels | RW | List of names of labels applied to the test |
 *
 * Test configuration is performed via the test's `settings` attribute. Some settings are common to all tests while others are specific to tests of a given type.
 * ### Common Test Settings
 * The following settings are used for tests of all types:
 * | Attribute | Purpose | Required |
 * |-----------|---------|----------|
 * | agentIds  | IDs of agents to execute tasks for the test | YES |
 * | period | Test execution interval in seconds | NO (default 60s) |
 * | family | IP address family. Used only for tests whose type is url or dns. Selects which type of DNS resource is queried for resolving hostname to target address | NO (default IP_FAMILY_DUAL) |
 * | notificationChannels | List of notification channels for the test | NO (default empty list) |
 * | healthSettings | A HealthSettings object that configures health settings for this test, which includes metric thresholds that define health status (warning and critical) and trigger associated alarms. | YES |
 * | ping | A TestPingSettings object that configures the ping task of the test | NO (default depends on test type) |
 * | trace | A TestTraceSettings object that configures the trace task of the test | NO (default depends on test type) |
 * | tasks | List of names of the tasks that will be executed for this test | YES |
 *
 * ### Type-specific Settings
 * Each test type has its own configuration object that represents the settings for that type. These type-specific objects are referenced by the attributes in `Test.settings`:
 * | Test type    | Settings attribute | Configuration object |
 * |--------------|-------------------------|---------------------------|
 * | ip           | ip                      | IpTest                    |
 * | hostname     | hostname                | HostnameTest              |
 * | network_grid | networkGrid             | IpTest                    |
 * | agent        | agent                   | AgentTest                 |
 * | network_mesh | networkMesh             | NetworkMeshTest           |
 * | flow         | flow                    | FlowTest                  |
 * | url          | url                     | UrlTest                   |
 * | page_load    | pageLoad                | PageLoadTest              |
 * | dns          | dns                     | DnsTest                   |
 * | dns_grid     | dnsGrid                 | DnsTest                   |
 *
 * # Test Results
 * Results of synthetic tests are returned as a sequence of `TestResults` objects. Each such object represents measurements and health evaluation for a single test at specific point in time. Measurements and health evaluation are grouped by agent and by task.
 * Granularity of timestamps in test results depends on the frequency (period) of the test and on the requested time range. The minimum granularity is 1 minute (even when period < 1 minute). The longer the time range, the lower the granularity.
 * # Network Traces
 * Synthetic tests that include the `traceroute` task collect the unidirectional network path from the agent to the target for each agent/target pair. The trace data are returned in the `GetTraceForTestResponse` object. The `paths` attribute of this object contains the collected network path for each agent/target pair and the round-trip time (RTT) to each hop.
 * Hops in actual network traces are identified by a `nodeId`. The mapping of node IDs to address, name, location, and other attributes of the hop is provided in a map that is stored in the `nodes` attribute of the `GetTraceForTestResponse` object.
 * # Agents
 * The Kentik synthetic monitoring system recognizes 2 types of agents:
 * * **Global** (public): Managed by Kentik and available to every Kentik user. All information about global agents in this API is read-only.
 * * **Private**: Deployed by each customer and available only to that customer.
 * To be visible in this API, a private agent must first associate itself with a customer account by contacting the Kentik system (via private API). Once the agent is associated it can be authorized via the API by changing its `status` to `AGENT_STATUS_OK`. For more information about private agent deployment, see [**Synthetic Agent Deployments**](https://kb.kentik.com/v4/Ma01.htm#Ma01-Synthetic_Agent_Deployments).
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  synthetics = {
    /**
     * @description Returns list of all synthetic agents available in the account.
     *
     * @tags SyntheticsAdminService
     * @name ListAgents
     * @summary List available agents
     * @request GET:/synthetics/v202202/agents
     * @secure
     */
    listAgents: (params: RequestParams = {}) =>
      this.request<V202202ListAgentsResponse, RpcStatus>({
        path: `/synthetics/v202202/agents`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update configuration of a synthetic agent.
     *
     * @tags SyntheticsAdminService
     * @name UpdateAgent
     * @summary Update configuration of an agent
     * @request PUT:/synthetics/v202202/agents/{agent.id}
     * @secure
     */
    updateAgent: (agentId: string, body: V202202UpdateAgentRequest, params: RequestParams = {}) =>
      this.request<V202202UpdateAgentResponse, RpcStatus>({
        path: `/synthetics/v202202/agents/${agentId}`,
        method: "PUT",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns information about the requested synthetic agent.
     *
     * @tags SyntheticsAdminService
     * @name GetAgent
     * @summary Get information about an agent
     * @request GET:/synthetics/v202202/agents/{agent.id}
     * @secure
     */
    getAgent: (agentId: string, params: RequestParams = {}) =>
      this.request<V202202GetAgentResponse, RpcStatus>({
        path: `/synthetics/v202202/agents/${agentId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Deletes the requested agent. The deleted agent is removed from configuration of all tests.
     *
     * @tags SyntheticsAdminService
     * @name DeleteAgent
     * @summary Delete an agent
     * @request DELETE:/synthetics/v202202/agents/{agent.id}
     * @secure
     */
    deleteAgent: (agentId: string, params: RequestParams = {}) =>
      this.request<V202202DeleteAgentResponse, RpcStatus>({
        path: `/synthetics/v202202/agents/${agentId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns probe results for a set of tests for specified period of time.
     *
     * @tags SyntheticsDataService
     * @name GetResultsForTests
     * @summary Get results for tests
     * @request POST:/synthetics/v202202/results
     * @secure
     */
    getResultsForTests: (body: V202202GetResultsForTestsRequest, params: RequestParams = {}) =>
      this.request<V202202GetResultsForTestsResponse, RpcStatus>({
        path: `/synthetics/v202202/results`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns a list of all configured active and paused synthetic tests.
     *
     * @tags SyntheticsAdminService
     * @name ListTests
     * @summary List all tests
     * @request GET:/synthetics/v202202/tests
     * @secure
     */
    listTests: (params: RequestParams = {}) =>
      this.request<V202202ListTestsResponse, RpcStatus>({
        path: `/synthetics/v202202/tests`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create synthetic test based on configuration provided in the request.
     *
     * @tags SyntheticsAdminService
     * @name CreateTest
     * @summary Create a test
     * @request POST:/synthetics/v202202/tests
     * @secure
     */
    createTest: (body: V202202CreateTestRequest, params: RequestParams = {}) =>
      this.request<V202202CreateTestResponse, RpcStatus>({
        path: `/synthetics/v202202/tests`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns configuration and status for the requested synthetic test.
     *
     * @tags SyntheticsAdminService
     * @name GetTest
     * @summary Get information about a test
     * @request GET:/synthetics/v202202/tests/{id}
     * @secure
     */
    getTest: (id: string, params: RequestParams = {}) =>
      this.request<V202202GetTestResponse, RpcStatus>({
        path: `/synthetics/v202202/tests/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Deletes the synthetics test. All accumulated results for the test cease to be accessible.
     *
     * @tags SyntheticsAdminService
     * @name DeleteTest
     * @summary Delete a synthetic test.
     * @request DELETE:/synthetics/v202202/tests/{id}
     * @secure
     */
    deleteTest: (id: string, params: RequestParams = {}) =>
      this.request<V202202DeleteTestResponse, RpcStatus>({
        path: `/synthetics/v202202/tests/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Updates configuration of a synthetic test.
     *
     * @tags SyntheticsAdminService
     * @name UpdateTest
     * @summary Update configuration of a test
     * @request PUT:/synthetics/v202202/tests/{id}
     * @secure
     */
    updateTest: (id: string, body: V202202UpdateTestRequest, params: RequestParams = {}) =>
      this.request<V202202UpdateTestResponse, RpcStatus>({
        path: `/synthetics/v202202/tests/${id}`,
        method: "PUT",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update status of a synthetic test
     *
     * @tags SyntheticsAdminService
     * @name SetTestStatus
     * @summary Update status of a synthetic test
     * @request PUT:/synthetics/v202202/tests/{id}/status
     * @secure
     */
    setTestStatus: (id: string, body: V202202SetTestStatusRequest, params: RequestParams = {}) =>
      this.request<V202202SetTestStatusResponse, RpcStatus>({
        path: `/synthetics/v202202/tests/${id}/status`,
        method: "PUT",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get network trace data for a specific synthetic test. The test must have traceroute task configured.
     *
     * @tags SyntheticsDataService
     * @name GetTraceForTest
     * @summary Get network trace data for a test
     * @request POST:/synthetics/v202202/trace
     * @secure
     */
    getTraceForTest: (body: V202202GetTraceForTestRequest, params: RequestParams = {}) =>
      this.request<V202202GetTraceForTestResponse, RpcStatus>({
        path: `/synthetics/v202202/trace`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}

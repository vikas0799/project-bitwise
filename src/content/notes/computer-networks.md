---
title: Computer Networks
description: OSI and TCP/IP models, IP addressing and subnetting, TCP vs UDP, the three-way handshake, DNS, HTTP and HTTPS, and what happens when you type a URL, with interview questions.
author: Bitwise School
---

A computer network connects devices so they can share data. Interviews focus on the layered models, how data moves between machines, and the protocols you use every day.

## Basics

### Network types

| Type | Range | Example |
| --- | --- | --- |
| PAN | A few metres | Bluetooth earbuds and phone |
| LAN | A building or campus | College lab network |
| MAN | A city | City-wide cable network |
| WAN | Countries and continents | The internet |

### Topologies

- **Bus**: one shared cable; cheap, but one break takes everything down.
- **Star**: every device connects to a central switch; easy to manage and the most common today.
- **Ring**: each device connects to two neighbours.
- **Mesh**: many redundant links; very reliable, expensive.
- **Hybrid / tree**: combinations of the above.

### Devices

| Device | Layer | Job |
| --- | --- | --- |
| Hub | Physical (1) | Repeats a signal to every port |
| Switch | Data link (2) | Forwards frames using MAC addresses |
| Router | Network (3) | Forwards packets between networks using IP addresses |
| Gateway | Any, often 7 | Connects networks that use different protocols |
| Access point | 1–2 | Connects wireless devices to a wired network |

## The OSI and TCP/IP models

| # | OSI layer | What it does | Examples | Data unit |
| --- | --- | --- | --- | --- |
| 7 | Application | Services for applications | HTTP, DNS, SMTP, FTP, SSH | Data |
| 6 | Presentation | Formatting, encryption, compression | TLS, JPEG, UTF-8 | Data |
| 5 | Session | Opening, managing and closing sessions | RPC, NetBIOS | Data |
| 4 | Transport | End-to-end delivery, ports, reliability | TCP, UDP | Segment / datagram |
| 3 | Network | Logical addressing and routing | IP, ICMP, routers | Packet |
| 2 | Data link | Node-to-node delivery, MAC addresses, error detection | Ethernet, Wi-Fi, ARP, switches | Frame |
| 1 | Physical | Bits over the medium | Cables, radio, hubs | Bits |

Memory trick (top to bottom): **All People Seem To Need Data Processing**.

The **TCP/IP model** used on the internet has four layers: **Application** (OSI 5–7), **Transport** (4), **Internet** (3) and **Network access / link** (1–2).

**Encapsulation**: each layer adds its own header as data moves down the stack, and the receiver removes them on the way up.

## Physical and data link layer

- A **MAC address** is a 48-bit hardware address burned into the network card, for example `3C:22:FB:1A:2B:9C`.
- **Error detection**: parity bits, checksums and **CRC** (cyclic redundancy check).
- **Flow control**: stop-and-wait, and sliding window protocols (**Go-Back-N** resends everything after a lost frame; **Selective Repeat** resends only the lost one).
- **Media access**: **CSMA/CD** (detect collisions, used by classic wired Ethernet) and **CSMA/CA** (avoid collisions, used by Wi-Fi).
- **ARP** maps an IP address to a MAC address on the local network ("who has 192.168.1.1?").
- **Circuit switching** reserves a path for the whole call (old phone lines); **packet switching** splits data into packets that can take different paths (the internet).

## Network layer

### IPv4 addresses

An IPv4 address is 32 bits, written as four octets, for example `192.168.1.10`.

| Class | First octet | Default mask | Use |
| --- | --- | --- | --- |
| A | 1–126 | /8 (255.0.0.0) | Very large networks |
| B | 128–191 | /16 (255.255.0.0) | Medium networks |
| C | 192–223 | /24 (255.255.255.0) | Small networks |
| D | 224–239 | – | Multicast |
| E | 240–255 | – | Experimental |

`127.0.0.0/8` is loopback (`127.0.0.1` is localhost). **Private ranges** (not routed on the internet): `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`.

### Subnetting and CIDR

CIDR notation `/n` means the first n bits are the network part.

Example: `192.168.1.0/26`

- Mask: `255.255.255.192`
- Addresses per subnet: 2^(32 − 26) = **64**
- Usable hosts per subnet: 64 − 2 = **62** (network and broadcast addresses are reserved)
- The /24 splits into four subnets: `.0–.63`, `.64–.127`, `.128–.191`, `.192–.255`

### NAT, IPv6, DHCP and ICMP

- **NAT** lets many private devices share one public IP. Your home router does this.
- **IPv6** uses 128-bit addresses, for example `2001:db8::1`, so address shortage and heavy NAT are no longer needed.
- **DHCP** gives devices an IP address automatically in four steps: **D**iscover, **O**ffer, **R**equest, **A**cknowledge (DORA).
- **ICMP** carries control and error messages. `ping` uses echo request/reply, and `traceroute` uses TTL expiry to show each hop.

### Routing

- **Static routing**: routes configured by hand.
- **Distance vector** (e.g. RIP): routers share their tables with neighbours; simple, slower to converge.
- **Link state** (e.g. OSPF): every router learns the full map and runs Dijkstra's algorithm.
- **BGP**: the protocol that connects the networks of different organisations on the internet.

## Transport layer

Ports identify applications on a machine. A connection is identified by source IP, source port, destination IP, destination port and protocol.

| Port | Service |
| --- | --- |
| 20, 21 | FTP |
| 22 | SSH |
| 25 | SMTP |
| 53 | DNS |
| 67, 68 | DHCP |
| 80 | HTTP |
| 443 | HTTPS |
| 3306 | MySQL |
| 5432 | PostgreSQL |
| 27017 | MongoDB |

### TCP vs UDP

| TCP | UDP |
| --- | --- |
| Connection-oriented (handshake first) | Connectionless |
| Reliable: acknowledgements and retransmission | Best effort: no guarantee of delivery |
| Ordered delivery | No ordering |
| Flow and congestion control | None built in |
| Heavier header (20+ bytes) | Light header (8 bytes) |
| Web, email, file transfer | Video calls, gaming, DNS lookups, live streaming |

### Three-way handshake

```text
Client  ── SYN (seq = x) ──────────────▶  Server
Client  ◀── SYN-ACK (seq = y, ack = x+1) ─ Server
Client  ── ACK (ack = y+1) ────────────▶  Server
```

Closing uses four steps: FIN, ACK, FIN, ACK. The side that closes first waits in **TIME_WAIT** so late packets do not confuse a new connection.

### Reliability, flow control and congestion control

- **Reliability**: sequence numbers, acknowledgements, timeouts and retransmission.
- **Flow control**: the receiver advertises a **window** so a fast sender does not overwhelm it.
- **Congestion control**: protects the network. **Slow start** grows the window quickly, **congestion avoidance** grows it linearly, and on loss TCP backs off (fast retransmit and fast recovery).

## Application layer

### DNS

DNS turns names like `www.example.com` into IP addresses.

1. The browser and OS check their caches.
2. The query goes to a **recursive resolver** (your ISP, or a public one such as 8.8.8.8).
3. The resolver asks a **root server**, which points to the **TLD server** for `.com`.
4. The TLD server points to the domain's **authoritative name server**.
5. The authoritative server returns the IP. Every step is cached according to its TTL.

Common record types: **A** (IPv4), **AAAA** (IPv6), **CNAME** (alias), **MX** (mail server), **NS** (name server), **TXT** (text, often for verification).

### HTTP

- **Methods**: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE, plus HEAD and OPTIONS.
- **Idempotent** methods give the same result if repeated: GET, PUT, DELETE. POST is not idempotent.
- **Status codes**: 1xx informational, 2xx success (200, 201, 204), 3xx redirect (301, 302, 304), 4xx client error (400, 401, 403, 404, 429) and 5xx server error (500, 502, 503).
- **HTTP is stateless**; cookies, sessions and tokens add state.
- **Versions**: HTTP/1.1 (keep-alive connections), HTTP/2 (multiplexing many requests over one connection, header compression) and HTTP/3 (runs over QUIC on UDP, faster connection setup).

### HTTPS and TLS

HTTPS is HTTP over **TLS**. In simplified form, the handshake works like this:

1. The client says hello and lists the ciphers it supports.
2. The server replies with its **certificate** (its public key, signed by a certificate authority).
3. The client verifies the certificate, and both sides agree on a shared **session key** using asymmetric cryptography.
4. All further data is encrypted with fast **symmetric** encryption using that session key.

### Other protocols

- **SMTP** sends email; **POP3** downloads and usually deletes it from the server; **IMAP** keeps it synced on the server.
- **FTP** transfers files; **SSH** gives a secure remote shell.
- **WebSocket** keeps a full-duplex connection open for real-time apps like chat.

## What happens when you type a URL and press Enter?

1. The browser parses the URL and checks its cache (HSTS may force HTTPS).
2. **DNS resolution** finds the server's IP address.
3. The browser opens a **TCP connection** (three-way handshake), then does the **TLS handshake** for HTTPS.
4. It sends an **HTTP request** (`GET /`) with headers and cookies.
5. The request may pass through a CDN, load balancer and reverse proxy before reaching the application server, which may query a database or cache.
6. The server returns an **HTTP response** with a status code, headers and HTML.
7. The browser parses the HTML, builds the DOM and CSSOM, downloads CSS, JS and images, runs JavaScript and **renders** the page.

## Security basics

- **Symmetric encryption** uses one shared key (AES); fast. **Asymmetric encryption** uses a public/private key pair (RSA, ECC); used for key exchange and signatures.
- **Hashing** is one-way (SHA-256); used for integrity checks and password storage (with salt and a slow hash like bcrypt).
- **Firewalls** filter traffic by rules. A **VPN** creates an encrypted tunnel over a public network.
- **Common attacks**: DDoS (flooding a server), man-in-the-middle (intercepting traffic; HTTPS prevents it), DNS spoofing, and at the application level XSS and SQL injection.

## Interview questions

**1. What is the difference between TCP and UDP?**
TCP is connection-oriented, reliable and ordered, with flow and congestion control. UDP is connectionless and best-effort, with lower overhead, which suits real-time traffic.

**2. Why does TCP need a three-way handshake and not two?**
Both sides must agree on each other's initial sequence numbers and confirm they can send and receive. The third step also protects against old duplicate connection requests.

**3. What is the difference between a switch and a router?**
A switch forwards frames within a network using MAC addresses (layer 2). A router forwards packets between networks using IP addresses (layer 3).

**4. What does ARP do?**
It finds the MAC address that belongs to an IP address on the local network.

**5. How many usable hosts are in a /27?**
2^5 = 32 addresses, minus network and broadcast, so 30 usable hosts.

**6. What is the difference between HTTP and HTTPS?**
HTTPS runs HTTP over TLS, which encrypts traffic and authenticates the server with a certificate, preventing eavesdropping and tampering.

**7. 301 vs 302?**
301 is a permanent redirect (browsers and search engines remember it). 302 is temporary.

**8. What is DNS caching and TTL?**
Resolvers and browsers store DNS answers for the record's time-to-live, which avoids repeating the full lookup.

**9. What is NAT and why is it used?**
It translates private addresses to a public one, so many devices can share one public IPv4 address. This saves addresses and hides internal hosts.

**10. What is the difference between GET and POST?**
GET reads data, sends parameters in the URL, is idempotent and cacheable. POST sends data in the body to create or process something, and is not idempotent.

**11. What is a socket?**
An endpoint for communication, identified by an IP address and a port.

**12. Explain OSI vs TCP/IP.**
OSI is a seven-layer reference model for teaching and design. TCP/IP is the four-layer model the internet actually uses. It merges OSI's top three layers into Application and its bottom two into Link.

export const BluetoothPrinter = {
    async printReceipt(transactionData) {
        const { code, method, total, subtotal, discount, itemsCount, summary } = transactionData;
        const SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
        const CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

        try {
            let device;

            // 1. Try to get already permitted devices (One-click print)
            if (navigator.bluetooth.getDevices) {
                const devices = await navigator.bluetooth.getDevices();
                const lastDeviceId = localStorage.getItem('last_bluetooth_printer_id');
                // Prefer the last used one, or just the first permitted one
                device = devices.find(d => d.id === lastDeviceId) || devices[0];
            }

            // 2. If no "remembered" device, request a new one
            if (!device) {
                try {
                    device = await navigator.bluetooth.requestDevice({
                        filters: [{ services: [SERVICE_UUID] }],
                        optionalServices: [SERVICE_UUID]
                    });
                } catch (err) {
                    if (err.name === 'NotFoundError') {
                        console.log('User cancelled printer selection');
                        return false;
                    }
                    throw err;
                }
            }

            if (device && device.id) {
                localStorage.setItem('last_bluetooth_printer_id', device.id);
            }

            // 3. Connect to GATT with state check
            let server;
            if (device.gatt.connected) {
                server = device.gatt;
            } else {
                server = await device.gatt.connect();
            }
            const service = await server.getPrimaryService(SERVICE_UUID);
            const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

            const encoder = new TextEncoder();
            const ESC = '\u001b';
            const GS = '\u001d';

            // Helper to send chunks
            const send = async (data) => {
                const chunk = typeof data === 'string' ? encoder.encode(data) : data;
                await characteristic.writeValue(chunk);
            };

            // 2. Format Receipt (80mm / 48 chars)
            // Reset printer
            await send(ESC + '@');

            // Align Center
            await send(ESC + 'a' + '\u0001');
            await send(ESC + '!' + '\u0038'); // Double height/width
            await send("ROOM COLLECTION\n");
            await send(ESC + '!' + '\u0000'); // Reset font
            await send("------------------------------------------------\n");

            // Align Left
            await send(ESC + 'a' + '\u0000');
            await send(`Date: ${new Date().toLocaleString()}\n`);
            await send(`Ref: ${code}\n`);
            await send(`Payment: ${method}\n`);
            await send("------------------------------------------------\n");

            // Items Summary (Web-app structure is params-based, summary is a string)
            if (summary) {
                await send("Items:\n");
                await send(`${summary}\n`);
                await send("------------------------------------------------\n");
            }

            // Totals
            const padRow = (left, right) => {
                const spaces = 48 - left.length - right.length;
                return left + " ".repeat(Math.max(1, spaces)) + right + "\n";
            };

            await send(padRow("Subtotal", `IDR ${Number(subtotal).toLocaleString('id-ID')}`));
            if (discount > 0) {
                await send(padRow("Discount", `-IDR ${Number(discount).toLocaleString('id-ID')}`));
            }
            await send("------------------------------------------------\n");

            // Bold Total
            await send(ESC + 'E' + '\u0001'); // Bold on
            await send(padRow("TOTAL", `IDR ${Number(total).toLocaleString('id-ID')}`));
            await send(ESC + 'E' + '\u0000'); // Bold off

            await send("\n\n");
            await send(ESC + 'a' + '\u0001'); // Center
            await send("Thank You!\n");
            await send("Please come again\n");
            await send("\n\n\n\n"); // Feed

            await server.disconnect();
            return true;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('Bluetooth pairing cancelled by user');
                return false;
            }
            console.error('Web Bluetooth Printing failed:', error);
            // Fallback to browser print if it's a real error (not cancellation or security)
            if (error.name !== 'SecurityError') {
                window.print();
            }
            return false;
        }
    }
};
